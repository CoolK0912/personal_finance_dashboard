from django.db import models

# Create your models here.
class User(models.Model):
    username = models.CharField(max_length=150, unique=True) # unique username
    email = models.EmailField(unique=True) # unique email address
    password = models.CharField(max_length=128) # hashed password

    def __str__(self):
        return self.username

class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions') # which user made the transaction
    amount = models.DecimalField(max_digits=10, decimal_places=2) # monetary amount
    description = models.CharField(max_length=255) # message associated with the transaction
    date = models.DateTimeField(auto_now_add=True) # when did the transaction occur
    account = models.ForeignKey('Account', on_delete=models.CASCADE, related_name='transactions') # which account the transaction belongs to

    def __str__(self):
        return f"{self.description}: {self.amount} on {self.date}"
    
class Account(models.Model):
    name_account = models.CharField(max_length=100) # name of the accoun eg. checking, savings
    balance = models.DecimalField(max_digits=15, decimal_places=2) # current balance

    def __str__(self):
        return f"{self.name_account} - balance: {self.balance}"

