from django.db import models
from account.models import Account
from django.contrib.auth.models import User
from category.models import Category

# Create your models here.
class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions') # which user made the transaction
    amount = models.DecimalField(max_digits=10, decimal_places=2) # monetary amount
    description = models.CharField(max_length=255) # message associated with the transaction
    date = models.DateTimeField(auto_now_add=True) # when did the transaction occur
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions') # which account the transaction is associated with
    budget_category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='transactions', blank=True, null=True) # optional budget category
    type = models.CharField(max_length=50, choices=[('deposit', 'Deposit'), ('withdrawal', 'Withdrawal')]) # type of transaction

    def __str__(self):
        return f"{self.description}: ${self.amount} on {self.date}"