from django.shortcuts import render
from http import HttpResponse   
from . import models

# Create your views here.
def view_budgets(request):
    budgets = models.Budget.objects.all()
    output = ", ".join([b.name for b in budgets])
    return HttpResponse(output)

def add_budget(request):
    # Logic to add a budget would go here
    return HttpResponse("Budget added successfully.")

def delete_budget(request, budget_id):
    # Logic to delete a budget would go here
    return HttpResponse(f"Budget {budget_id} deleted successfully.")

def update_budget(request, budget_id):
    # Logic to update a budget would go here
    return HttpResponse(f"Budget {budget_id} updated successfully.")