from django_distill import distill_path
from . import views


# distill_func=None means "no URL parameters — render once with no arguments"
# All names are preserved exactly — {% url 'name' %} tags remain unchanged.

urlpatterns = [
    distill_path('', views.index, name='index',
                 distill_func=None),
    distill_path('about/', views.about, name='about',
                 distill_func=None),
    distill_path('resume/', views.resume, name='resume',
                 distill_func=None),
    distill_path('services/', views.services, name='services',
                 distill_func=None),
    distill_path('service-details/', views.service_details, name='service-details',
                 distill_func=None),
    distill_path('portfolio/', views.portfolio, name='portfolio',
                 distill_func=None),
    distill_path('portfolio-details/', views.portfolio_details, name='portfolio-details',
                 distill_func=None),
    distill_path('decision-room/', views.decision_room, name='decision-room',
                 distill_func=None),
    distill_path('contact/', views.contact, name='contact',
                 distill_func=None),
]
