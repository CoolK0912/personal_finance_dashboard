from django.db import models
from account.models import Account
from django.contrib.auth.models import User

# Create your models here.
class Budget(models.Model):
    name = models.CharField(max_length=100)  # name of the budget
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)  # total budgeted amount
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='budgets')  # associated account
    start_date = models.DateField()  # start date of the budget
    end_date = models.DateField()  # end date of the budget
    spent_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # amount spent so far
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')

    def __str__(self):
        return f"{self.name}: {self.spent_amount}/{self.total_amount} until {self.end_date}"