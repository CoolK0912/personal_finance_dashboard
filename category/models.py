from django.db import models

# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=100)  # name of the category
    description = models.TextField(blank=True, null=True)  # optional description of the category
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='categories')  # associated user
    budget = models.ForeignKey('budget.Budget', on_delete=models.CASCADE, related_name='categories', blank=True, null=True)  # associated budget, optional

    def __str__(self):
        return self.name