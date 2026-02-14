from django.contrib import admin
from django.db.models import Sum, Count
from django.utils.html import format_html
from .models import Account
from transaction.models import Transaction


class TransactionInline(admin.TabularInline):
    model = Transaction
    extra = 0
    fields = ['date', 'type', 'amount', 'description', 'budget_category']
    readonly_fields = ['date']
    ordering = ['-date']
    show_change_link = True

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('budget_category')


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['name_account', 'user_link', 'balance_display', 'transaction_count', 'total_deposits', 'total_withdrawals']
    list_filter = ['user', 'name_account']
    search_fields = ['name_account', 'user__username', 'user__email']
    list_per_page = 25
    ordering = ['-balance']

    fieldsets = (
        ('Account Information', {
            'fields': ('name_account', 'balance')
        }),
        ('Owner', {
            'fields': ('user',)
        }),
    )

    autocomplete_fields = ['user']
    inlines = [TransactionInline]

    def user_link(self, obj):
        from django.urls import reverse
        url = reverse('admin:auth_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.username)
    user_link.short_description = 'User'
    user_link.admin_order_field = 'user__username'

    def balance_display(self, obj):
        color = 'green' if obj.balance >= 0 else 'red'
        return format_html('<span style="color: {}; font-weight: bold;">${:,.2f}</span>', color, obj.balance)
    balance_display.short_description = 'Balance'
    balance_display.admin_order_field = 'balance'

    def transaction_count(self, obj):
        count = obj.transactions.count()
        return format_html('<span style="background: #e0e0e0; padding: 2px 8px; border-radius: 10px;">{}</span>', count)
    transaction_count.short_description = '# Transactions'

    def total_deposits(self, obj):
        total = obj.transactions.filter(type='deposit').aggregate(Sum('amount'))['amount__sum'] or 0
        return format_html('<span style="color: green;">+${:,.2f}</span>', total)
    total_deposits.short_description = 'Total Deposits'

    def total_withdrawals(self, obj):
        total = obj.transactions.filter(type='withdrawal').aggregate(Sum('amount'))['amount__sum'] or 0
        return format_html('<span style="color: red;">-${:,.2f}</span>', total)
    total_withdrawals.short_description = 'Total Withdrawals'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').prefetch_related('transactions')

    actions = ['recalculate_balance']

    @admin.action(description='Recalculate balance from transactions')
    def recalculate_balance(self, request, queryset):
        for account in queryset:
            deposits = account.transactions.filter(type='deposit').aggregate(Sum('amount'))['amount__sum'] or 0
            withdrawals = account.transactions.filter(type='withdrawal').aggregate(Sum('amount'))['amount__sum'] or 0
            # This is informational - you'd need to decide how to handle this based on your business logic
            self.message_user(request, f"{account.name_account}: Deposits={deposits}, Withdrawals={withdrawals}, Net={deposits-withdrawals}")
