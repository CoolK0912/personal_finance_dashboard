from django.db import models

# Create your models here.
class Account(models.Model):
   name_account = models.CharField(max_length=100) # name of the accoun eg. checking, savings
   balance = models.DecimalField(max_digits=15, decimal_places=2) # current balance


   def __str__(self):
       return f"{self.name_account} - balance: {self.balance}"
