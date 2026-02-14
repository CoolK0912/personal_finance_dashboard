from rest_framework import serializers
from .models import Budget

class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ['id', 'name', 'total_amount', 'account', 'start_date', 'end_date', 'spent_amount', 'user']
        read_only_fields = ['id', 'user']
