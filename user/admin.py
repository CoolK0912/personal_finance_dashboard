from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.db.models import Sum, Count
from django.utils.html import format_html
from account.models import Account
from transaction.models import Transaction
from budget.models import Budget
from category.models import Category


class AccountInline(admin.TabularInline):
    model = Account
    extra = 0
    fields = ['name_account', 'balance']
    readonly_fields = ['balance']
    show_change_link = True


class BudgetInline(admin.TabularInline):
    model = Budget
    extra = 0
    fields = ['name', 'total_amount', 'spent_amount', 'start_date', 'end_date']
    readonly_fields = ['spent_amount']
    show_change_link = True


class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'full_name', 'is_active', 'is_staff',
                    'total_balance', 'account_count', 'transaction_count', 'date_joined']
    list_filter = ['is_staff', 'is_superuser', 'is_active', 'date_joined']
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering = ['-date_joined']

    inlines = [AccountInline, BudgetInline]

    def full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else format_html('<span style="color: #999;">—</span>')
    full_name.short_description = 'Full Name'

    def total_balance(self, obj):
        total = Account.objects.filter(user=obj).aggregate(Sum('balance'))['balance__sum'] or 0
        color = 'green' if total >= 0 else 'red'
        return format_html('<span style="color: {}; font-weight: bold;">${:,.2f}</span>', color, total)
    total_balance.short_description = 'Total Balance'

    def account_count(self, obj):
        count = Account.objects.filter(user=obj).count()
        return format_html('<span style="background: #17a2b8; color: white; padding: 2px 8px; border-radius: 10px;">{}</span>', count)
    account_count.short_description = 'Accounts'

    def transaction_count(self, obj):
        count = Transaction.objects.filter(user=obj).count()
        return format_html('<span style="background: #6c757d; color: white; padding: 2px 8px; border-radius: 10px;">{}</span>', count)
    transaction_count.short_description = 'Transactions'

    actions = ['export_user_summary', 'deactivate_users', 'activate_users']

    @admin.action(description='Export financial summary for selected users')
    def export_user_summary(self, request, queryset):
        summaries = []
        for user in queryset:
            accounts = Account.objects.filter(user=user)
            transactions = Transaction.objects.filter(user=user)

            total_balance = accounts.aggregate(Sum('balance'))['balance__sum'] or 0
            deposits = transactions.filter(type='deposit').aggregate(Sum('amount'))['amount__sum'] or 0
            withdrawals = transactions.filter(type='withdrawal').aggregate(Sum('amount'))['amount__sum'] or 0

            summaries.append(
                f"{user.username}: Balance=${total_balance:,.2f}, "
                f"Deposits=${deposits:,.2f}, Withdrawals=${withdrawals:,.2f}"
            )

        self.message_user(request, ' | '.join(summaries))

    @admin.action(description='Deactivate selected users')
    def deactivate_users(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f'{queryset.count()} user(s) deactivated.')

    @admin.action(description='Activate selected users')
    def activate_users(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f'{queryset.count()} user(s) activated.')


# Unregister the default UserAdmin and register our custom one
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Customize Admin Site Header
admin.site.site_header = 'Finance Dashboard Administration'
admin.site.site_title = 'Finance Admin'
admin.site.index_title = 'Financial Management Dashboard'
