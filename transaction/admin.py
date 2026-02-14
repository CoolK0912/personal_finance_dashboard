from django.contrib import admin
from django.db.models import Sum
from django.utils.html import format_html
from django.utils import timezone
from datetime import timedelta
from .models import Transaction


class AmountRangeFilter(admin.SimpleListFilter):
    title = 'Amount Range'
    parameter_name = 'amount_range'

    def lookups(self, request, model_admin):
        return (
            ('0-50', '$0 - $50'),
            ('50-100', '$50 - $100'),
            ('100-500', '$100 - $500'),
            ('500-1000', '$500 - $1,000'),
            ('1000+', '$1,000+'),
        )

    def queryset(self, request, queryset):
        if self.value() == '0-50':
            return queryset.filter(amount__lte=50)
        if self.value() == '50-100':
            return queryset.filter(amount__gt=50, amount__lte=100)
        if self.value() == '100-500':
            return queryset.filter(amount__gt=100, amount__lte=500)
        if self.value() == '500-1000':
            return queryset.filter(amount__gt=500, amount__lte=1000)
        if self.value() == '1000+':
            return queryset.filter(amount__gt=1000)


class DateRangeFilter(admin.SimpleListFilter):
    title = 'Date Range'
    parameter_name = 'date_range'

    def lookups(self, request, model_admin):
        return (
            ('today', 'Today'),
            ('week', 'This Week'),
            ('month', 'This Month'),
            ('quarter', 'This Quarter'),
            ('year', 'This Year'),
        )

    def queryset(self, request, queryset):
        today = timezone.now().date()
        if self.value() == 'today':
            return queryset.filter(date__date=today)
        if self.value() == 'week':
            start = today - timedelta(days=today.weekday())
            return queryset.filter(date__date__gte=start)
        if self.value() == 'month':
            return queryset.filter(date__year=today.year, date__month=today.month)
        if self.value() == 'quarter':
            quarter_start_month = ((today.month - 1) // 3) * 3 + 1
            return queryset.filter(date__year=today.year, date__month__gte=quarter_start_month)
        if self.value() == 'year':
            return queryset.filter(date__year=today.year)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'date_display', 'user_link', 'type_badge', 'amount_display',
                    'description_short', 'account_link', 'category_badge']
    list_filter = ['type', 'account', 'budget_category', DateRangeFilter, AmountRangeFilter, 'user']
    search_fields = ['description', 'user__username', 'account__name_account', 'budget_category__name']
    list_per_page = 50
    date_hierarchy = 'date'
    ordering = ['-date']

    fieldsets = (
        ('Transaction Details', {
            'fields': ('type', 'amount', 'description')
        }),
        ('Associations', {
            'fields': ('user', 'account', 'budget_category')
        }),
        ('Timestamps', {
            'fields': ('date',),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ['date']
    autocomplete_fields = ['user', 'account', 'budget_category']
    list_select_related = ['user', 'account', 'budget_category']

    def date_display(self, obj):
        return obj.date.strftime('%Y-%m-%d %H:%M')
    date_display.short_description = 'Date'
    date_display.admin_order_field = 'date'

    def user_link(self, obj):
        from django.urls import reverse
        url = reverse('admin:auth_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.username)
    user_link.short_description = 'User'
    user_link.admin_order_field = 'user__username'

    def type_badge(self, obj):
        if obj.type == 'deposit':
            return format_html('<span style="background: #d4edda; color: #155724; padding: 3px 8px; border-radius: 3px; font-size: 11px;">DEPOSIT</span>')
        else:
            return format_html('<span style="background: #f8d7da; color: #721c24; padding: 3px 8px; border-radius: 3px; font-size: 11px;">WITHDRAWAL</span>')
    type_badge.short_description = 'Type'
    type_badge.admin_order_field = 'type'

    def amount_display(self, obj):
        color = 'green' if obj.type == 'deposit' else 'red'
        sign = '+' if obj.type == 'deposit' else '-'
        return format_html('<span style="color: {}; font-weight: bold;">{} ${:,.2f}</span>', color, sign, obj.amount)
    amount_display.short_description = 'Amount'
    amount_display.admin_order_field = 'amount'

    def description_short(self, obj):
        if len(obj.description) > 30:
            return f"{obj.description[:30]}..."
        return obj.description
    description_short.short_description = 'Description'

    def account_link(self, obj):
        from django.urls import reverse
        url = reverse('admin:account_account_change', args=[obj.account.id])
        return format_html('<a href="{}">{}</a>', url, obj.account.name_account)
    account_link.short_description = 'Account'
    account_link.admin_order_field = 'account__name_account'

    def category_badge(self, obj):
        if obj.budget_category:
            return format_html('<span style="background: #e2e3e5; padding: 2px 8px; border-radius: 10px; font-size: 11px;">{}</span>', obj.budget_category.name)
        return format_html('<span style="color: #999;">—</span>')
    category_badge.short_description = 'Category'

    actions = ['mark_as_deposit', 'mark_as_withdrawal', 'export_selected']

    @admin.action(description='Mark selected as Deposit')
    def mark_as_deposit(self, request, queryset):
        updated = queryset.update(type='deposit')
        self.message_user(request, f'{updated} transaction(s) marked as deposit.')

    @admin.action(description='Mark selected as Withdrawal')
    def mark_as_withdrawal(self, request, queryset):
        updated = queryset.update(type='withdrawal')
        self.message_user(request, f'{updated} transaction(s) marked as withdrawal.')

    @admin.action(description='Export selected transactions summary')
    def export_selected(self, request, queryset):
        total_deposits = queryset.filter(type='deposit').aggregate(Sum('amount'))['amount__sum'] or 0
        total_withdrawals = queryset.filter(type='withdrawal').aggregate(Sum('amount'))['amount__sum'] or 0
        count = queryset.count()
        self.message_user(
            request,
            f'Selected {count} transactions: Deposits=${total_deposits:,.2f}, Withdrawals=${total_withdrawals:,.2f}, Net=${total_deposits-total_withdrawals:,.2f}'
        )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'account', 'budget_category')
