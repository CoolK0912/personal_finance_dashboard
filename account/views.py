from django.shortcuts import render
from django.http import HttpResponse


# Create your views here.
def view_accounts(request):
   # Logic to view accounts would go here
   return HttpResponse("Here are the accounts.")


def add_account(request):
   # Logic to add an account would go here
   return HttpResponse("Account added successfully.")


def delete_account(request, account_id):
   # Logic to delete an account would go here
   return HttpResponse(f"Account {account_id} deleted successfully.")



