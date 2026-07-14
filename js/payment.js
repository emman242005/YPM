const paymentForm = document.getElementById('paymentForm');
const paymentNote = document.getElementById('paymentNote');
const paySubmitBtn = document.getElementById('paySubmitBtn');

// Get role from URL (?role=parent or ?role=teacher)
const urlParams = new URLSearchParams(window.location.search);
const role = urlParams.get('role');

// If someone lands here without being logged in, send them to login first
(async () => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    window.location.href = "login.html";
  }
})();

if (paymentForm) {
  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    paySubmitBtn.disabled = true;
    paymentNote.textContent = "Processing payment...";

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      paymentNote.textContent = "You must be logged in to pay. Redirecting to login...";
      setTimeout(() => { window.location.href = "login.html"; }, 1500);
      return;
    }

    const momoProvider = document.getElementById('momoProvider').value;
    const momoNumber = document.getElementById('momoNumber').value;

    // ---------------------------------------------------------------
    // SIMULATED PAYMENT (Stage 1)
    // In Stage 2, this block gets replaced with a real API call to
    // MTN MoMo / Orange Money, and payment_status only updates once
    // their payment gateway confirms success via webhook/callback.
    // ---------------------------------------------------------------
    setTimeout(async () => {
      const tableName = role === 'teacher' ? 'teachers' : 'parents';

      const { error: updateError } = await supabaseClient
        .from(tableName)
        .update({
          payment_status: 'paid',
          payment_amount: 1000,
          payment_method: momoProvider === 'mtn' ? 'MTN Mobile Money' : 'Orange Money',
          payment_date: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        paymentNote.textContent = "Error updating payment status: " + updateError.message;
        paySubmitBtn.disabled = false;
        console.error(updateError);
        return;
      }

      paymentNote.textContent = "Payment successful! Redirecting to your dashboard...";

      setTimeout(() => {
        window.location.href = role === 'teacher' ? "dashboard-teacher.html" : "dashboard-parent.html";
      }, 1500);
    }, 1800); // simulate a brief processing delay
  });
}