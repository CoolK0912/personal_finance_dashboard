from django.contrib import admin
from django.db.models import Sum, Count
from django.utils.html import format_html
from .models import Category
from transaction.models import Transaction


class TransactionInline(admin.TabularInline):
    model = Transaction
    fk_name = 'budget_category'
    extra = 0
    fields = ['date', 'type', 'amount', 'description', 'account']
    readonly_fields = ['date']
    ordering = ['-date']
    show_change_link = True
    max_num = 10
    verbose_name = "Recent Transaction"
    verbose_name_plural = "Recent Transactions (Last 10)"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('account')[:10]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'user_link', 'description_short', 'budget_link',
                    'transaction_count', 'total_spent', 'avg_transaction']
    list_filter = ['user', 'budget']
    search_fields = ['name', 'description', 'user__username', 'budget__name']
    list_per_page = 25
    ordering = ['name']

    fieldsets = (
        ('Category Information', {
            'fields': ('name', 'description')
        }),
        ('Associations', {
            'fields': ('user', 'budget')
        }),
    )

    autocomplete_fields = ['user', 'budget']
    inlines = [TransactionInline]
    list_select_related = ['user', 'budget']

    def user_link(self, obj):
        from django.urls import reverse
        url = reverse('admin:auth_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.username)
    user_link.short_description = 'User'
    user_link.admin_order_field = 'user__username'

    def description_short(self, obj):
        if obj.description:
            if len(obj.description) > 40:
                return f"{obj.description[:40]}..."
            return obj.description
        return format_html('<span style="color: #999;">—</span>')
    description_short.short_description = 'Description'

    def budget_link(self, obj):
        if obj.budget:
            from django.urls import reverse
            url = reverse('admin:budget_budget_change', args=[obj.budget.id])
            return format_html('<a href="{}">{}</a>', url, obj.budget.name)
        return format_html('<span style="color: #999;">—</span>')
    budget_link.short_description = 'Linked Budget'
    budget_link.admin_order_field = 'budget__name'

    def transaction_count(self, obj):
        count = obj.transactions.count()
        if count > 0:
            return format_html('<span style="background: #007bff; color: white; padding: 2px 8px; border-radius: 10px;">{}</span>', count)
        return format_html('<span style="color: #999;">0</span>')
    transaction_count.short_description = '# Transactions'

    def total_spent(self, obj):
        total = obj.transactions.filter(type='withdrawal').aggregate(Sum('amount'))['amount__sum'] or 0
        if total > 0:
            return format_html('<span style="color: #dc3545; font-weight: bold;">${:,.2f}</span>', total)
        return format_html('<span style="color: #999;">$0.00</span>')
    total_spent.short_description = 'Total Spent'

    def avg_transaction(self, obj):
        transactions = obj.transactions.filter(type='withdrawal')
        count = transactions.count()
        if count > 0:
            total = transactions.aggregate(Sum('amount'))['amount__sum'] or 0
            avg = total / count
            return format_html('${:,.2f}', avg)
        return format_html('<span style="color: #999;">—</span>')
    avg_transaction.short_description = 'Avg Transaction'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'budget').prefetch_related('transactions')

    actions = ['link_to_budget', 'unlink_from_budget', 'merge_categories']

    @admin.action(description='Unlink from budget')
    def unlink_from_budget(self, request, queryset):
        updated = queryset.update(budget=None)
        self.message_user(request, f'{updated} category(ies) unlinked from budgets.')

    @admin.action(description='Show spending summary')
    def merge_categories(self, request, queryset):
        total = 0
        details = []
        for cat in queryset:
            spent = cat.transactions.filter(type='withdrawal').aggregate(Sum('amount'))['amount__sum'] or 0
            total += spent
            details.append(f"{cat.name}: ${spent:,.2f}")

        self.message_user(
            request,
            f'Total spending across selected categories: ${total:,.2f} | {" | ".join(details)}'
        )
