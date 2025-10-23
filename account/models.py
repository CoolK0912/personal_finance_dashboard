from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Account(models.Model):
   name_account = models.CharField(max_length=100) # name of the accoun eg. checking, savings
   balance = models.DecimalField(max_digits=15, decimal_places=2) # current balance
   user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')

   def __str__(self):
       return f"{self.name_account} - balance: {self.balance}"
