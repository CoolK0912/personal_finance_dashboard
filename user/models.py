from django.db import models


# Create your models here.
class User(models.Model):
   username = models.CharField(max_length=150, unique=True) # unique username
   email = models.EmailField(unique=True) # unique email address
   password = models.CharField(max_length=128) # hashed password


   def __str__(self):
       return self.username
