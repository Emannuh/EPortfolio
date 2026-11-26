/**
 * Static-hosting form handler (Formspree with mailto fallback).
 *
 * Usage: <form data-formspree action="https://formspree.io/f/YOUR_FORM_ID">
 *   Optional: an element with [data-form-feedback] inside the form's parent
 *   for success/error messages.
 *
 * While the action still contains YOUR_FORM_ID, submissions open the
 * visitor's mail client instead, so the form never silently fails.
 */
(function () {
  "use strict";

  var FALLBACK_EMAIL = 'Emhmanuh@gmail.com';

  function field(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value.trim() : '';
  }

  function showFeedback(el, ok, text) {
    if (!el) return;
    el.className = 'alert ' + (ok ? 'alert-success' : 'alert-danger');
    el.textContent = text;
    el.style.display = 'block';
  }

  document.querySelectorAll('form[data-formspree]').forEach(function (form) {
    var feedback = form.parentElement.querySelector('[data-form-feedback]');
    var submitBtn = form.querySelector('[type="submit"]');
    var btnHTML = submitBtn ? submitBtn.innerHTML : '';
    var configured = form.action.indexOf('YOUR_FORM_ID') === -1;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      if (!configured) {
        var body = 'From: ' + field(form, 'name') + ' <' + field(form, 'email') + '>\n\n' + field(form, 'message');
        window.location.href = 'mailto:' + FALLBACK_EMAIL +
          '?subject=' + encodeURIComponent(field(form, 'subject') || 'Portfolio enquiry') +
          '&body=' + encodeURIComponent(body);
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }
      if (feedback) feedback.style.display = 'none';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Submission failed');
          showFeedback(feedback, true, "Message sent! I'll be in touch soon.");
          form.reset();
        })
        .catch(function () {
          showFeedback(feedback, false, 'Sorry, something went wrong. Please email ' + FALLBACK_EMAIL + ' directly.');
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = btnHTML; }
        });
    });
  });
})();
