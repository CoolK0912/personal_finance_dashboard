from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def index(request):
    return HttpResponse("Hello, this is the add_transaction app index view.")

def add_transaction(request):
    # Logic to add a transaction would go here
    return HttpResponse("Transaction added successfully.")

def view_transactions(request):
    # Logic to view transactions would go here
    return HttpResponse("Here are the transactions.")

def delete_transaction(request, transaction_id):
    # Logic to delete a transaction would go here
    return HttpResponse(f"Transaction {transaction_id} deleted successfully.")


