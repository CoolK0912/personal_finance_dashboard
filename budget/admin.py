from django.contrib import admin
from django.db.models import Sum
from django.utils.html import format_html
from django.utils import timezone
from .models import Budget
from category.models import Category


class CategoryInline(admin.TabularInline):
    model = Category
    extra = 0
    fields = ['name', 'description']
    show_change_link = True


class BudgetStatusFilter(admin.SimpleListFilter):
    title = 'Budget Status'
    parameter_name = 'status'

    def lookups(self, request, model_admin):
        return (
            ('on_track', 'On Track (< 80%)'),
            ('warning', 'Warning (80-100%)'),
            ('over', 'Over Budget (> 100%)'),
            ('active', 'Active'),
            ('ended', 'Ended'),
        )

    def queryset(self, request, queryset):
        today = timezone.now().date()
        if self.value() == 'on_track':
            return queryset.extra(where=["spent_amount / total_amount < 0.8"])
        if self.value() == 'warning':
            return queryset.extra(where=["spent_amount / total_amount >= 0.8 AND spent_amount / total_amount <= 1.0"])
        if self.value() == 'over':
            return queryset.extra(where=["spent_amount > total_amount"])
        if self.value() == 'active':
            return queryset.filter(start_date__lte=today, end_date__gte=today)
        if self.value() == 'ended':
            return queryset.filter(end_date__lt=today)


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['name', 'user_link', 'account_link', 'progress_bar', 'spent_display',
                    'total_display', 'remaining_display', 'date_range', 'status_badge']
    list_filter = ['user', 'account', BudgetStatusFilter]
    search_fields = ['name', 'user__username', 'account__name_account']
    list_per_page = 25
    date_hierarchy = 'start_date'
    ordering = ['-start_date']

    fieldsets = (
        ('Budget Information', {
            'fields': ('name', 'total_amount', 'spent_amount')
        }),
        ('Associations', {
            'fields': ('user', 'account')
        }),
        ('Period', {
            'fields': (('start_date', 'end_date'),)
        }),
    )

    autocomplete_fields = ['user', 'account']
    inlines = [CategoryInline]
    list_select_related = ['user', 'account']

    def user_link(self, obj):
        from django.urls import reverse
        url = reverse('admin:auth_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.username)
    user_link.short_description = 'User'
    user_link.admin_order_field = 'user__username'

    def account_link(self, obj):
        from django.urls import reverse
        url = reverse('admin:account_account_change', args=[obj.account.id])
        return format_html('<a href="{}">{}</a>', url, obj.account.name_account)
    account_link.short_description = 'Account'
    account_link.admin_order_field = 'account__name_account'

    def progress_bar(self, obj):
        if obj.total_amount == 0:
            percentage = 0
        else:
            percentage = min((float(obj.spent_amount) / float(obj.total_amount)) * 100, 100)

        if percentage > 100:
            color = '#dc3545'  # red
        elif percentage > 80:
            color = '#ffc107'  # yellow
        else:
            color = '#28a745'  # green

        return format_html(
            '''<div style="width: 100px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                <div style="width: {:.0f}%; background: {}; height: 20px; text-align: center; color: white; font-size: 11px; line-height: 20px;">
                    {:.0f}%
                </div>
            </div>''',
            percentage, color, percentage
        )
    progress_bar.short_description = 'Progress'

    def spent_display(self, obj):
        return format_html('<span style="color: #dc3545;">${:,.2f}</span>', obj.spent_amount)
    spent_display.short_description = 'Spent'
    spent_display.admin_order_field = 'spent_amount'

    def total_display(self, obj):
        return format_html('<span style="font-weight: bold;">${:,.2f}</span>', obj.total_amount)
    total_display.short_description = 'Budget'
    total_display.admin_order_field = 'total_amount'

    def remaining_display(self, obj):
        remaining = float(obj.total_amount) - float(obj.spent_amount)
        color = 'green' if remaining >= 0 else 'red'
        return format_html('<span style="color: {};">${:,.2f}</span>', color, remaining)
    remaining_display.short_description = 'Remaining'

    def date_range(self, obj):
        return f"{obj.start_date.strftime('%m/%d/%y')} - {obj.end_date.strftime('%m/%d/%y')}"
    date_range.short_description = 'Period'

    def status_badge(self, obj):
        today = timezone.now().date()
        percentage = (float(obj.spent_amount) / float(obj.total_amount)) * 100 if obj.total_amount > 0 else 0

        if obj.end_date < today:
            return format_html('<span style="background: #6c757d; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">ENDED</span>')
        elif percentage > 100:
            return format_html('<span style="background: #dc3545; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">OVER</span>')
        elif percentage > 80:
            return format_html('<span style="background: #ffc107; color: black; padding: 3px 8px; border-radius: 3px; font-size: 11px;">WARNING</span>')
        else:
            return format_html('<span style="background: #28a745; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">ON TRACK</span>')
    status_badge.short_description = 'Status'

    actions = ['reset_spent_amount', 'extend_by_month', 'duplicate_budget']

    @admin.action(description='Reset spent amount to zero')
    def reset_spent_amount(self, request, queryset):
        updated = queryset.update(spent_amount=0)
        self.message_user(request, f'{updated} budget(s) reset to zero spent.')

    @admin.action(description='Extend end date by 1 month')
    def extend_by_month(self, request, queryset):
        from datetime import timedelta
        for budget in queryset:
            budget.end_date = budget.end_date + timedelta(days=30)
            budget.save()
        self.message_user(request, f'{queryset.count()} budget(s) extended by 1 month.')

    @admin.action(description='Duplicate selected budgets (new period)')
    def duplicate_budget(self, request, queryset):
        from datetime import timedelta
        created = 0
        for budget in queryset:
            duration = budget.end_date - budget.start_date
            new_start = budget.end_date + timedelta(days=1)
            new_end = new_start + duration

            Budget.objects.create(
                name=f"{budget.name} (Copy)",
                total_amount=budget.total_amount,
                spent_amount=0,
                account=budget.account,
                start_date=new_start,
                end_date=new_end,
                user=budget.user
            )
            created += 1
        self.message_user(request, f'{created} budget(s) duplicated for next period.')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'account')
