from rest_framework import serializers
from transaction.models import Transaction
from django.contrib.auth.models import User
from account.models import Account
from category.models import Category

class TransactionSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    account_name = serializers.ReadOnlyField(source='account.name')
    budget_category_name = serializers.ReadOnlyField(source='budget_category.name')
    
    class Meta:
        model = Transaction
        fields = ['id', 'user', 'user_username', 'amount', 'description', 'date', 'account', 'account_name', 'budget_category' , 'budget_category_name', 'type']
        read_only_fields = ['id', 'date']

class UserSerializer(serializers.ModelSerializer):
    transaction = serializers.PrimaryKeyRelatedField(many=True, queryset=Transaction.objects.all())

    class Meta:
        model = User
        fields = ['id', 'username', 'transaction']