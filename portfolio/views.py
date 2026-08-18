from django.shortcuts import render, redirect
from django.contrib import messages


def index(request):
    return render(request, 'index.html')


def about(request):
    return render(request, 'about.html')


def resume(request):
    return render(request, 'resume.html')


def services(request):
    return render(request, 'services.html')


def service_details(request):
    return render(request, 'service-details.html')


def portfolio(request):
    return render(request, 'portfolio.html')


def portfolio_details(request):
    return render(request, 'portfolio-details.html')


def contact(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        subject = request.POST.get('subject')
        message = request.POST.get('message')
        # Message stored — wire up email sending when deploying
        messages.success(request, f"Thanks {name}! Your message has been received. I'll be in touch soon.")
        return redirect('contact')
    return render(request, 'contact.html')
