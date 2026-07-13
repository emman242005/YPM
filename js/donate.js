let selectedAmount = 0;

const amountBtns = document.querySelectorAll('.amount-btn-v2');
const customAmountInput = document.getElementById('customAmount');
const donateSummary = document.getElementById('donateSummary');

amountBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    amountBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    customAmountInput.value = '';
    selectedAmount = parseInt(btn.dataset.amount);
    updateSummary();
  });
});

customAmountInput.addEventListener('input', () => {
  amountBtns.forEach(b => b.classList.remove('active'));
  selectedAmount = parseInt(customAmountInput.value) || 0;
  updateSummary();
});

function updateSummary() {
  donateSummary.textContent = `Selected amount: $${selectedAmount}`;
}

// Method card switching
let selectedMethod = 'paypal';
const methodCards = document.querySelectorAll('.method-card-v2');
methodCards.forEach(card => {
  card.addEventListener('click', () => {
    methodCards.forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.method-panel-v2').forEach(p => p.classList.remove('active'));
    card.classList.add('active');
    selectedMethod = card.dataset.method;
    document.getElementById(selectedMethod + 'Panel').classList.add('active');
  });
});

function validateAmount() {
  if (selectedAmount < 2 || isNaN(selectedAmount)) {
    alert('Please select or enter an amount of at least $2.');
    return false;
  }
  return true;
}

document.getElementById('donateSubmitBtn').addEventListener('click', () => {
  if (!validateAmount()) return;

  if (selectedMethod === 'paypal') {
    alert(`This will redirect to PayPal to donate $${selectedAmount} once PayPal is connected.`);
    // Real PayPal integration goes here.
  } else if (selectedMethod === 'momo') {
    const momoNumber = document.getElementById('momoNumber').value;
    if (!momoNumber) {
      alert('Please enter your MTN Mobile Money number.');
      return;
    }
    alert(`This will charge $${selectedAmount} to ${momoNumber} once MTN MoMo Collections is connected.`);
    // Real MTN MoMo API call goes here.
  } else if (selectedMethod === 'card') {
    alert(`This will process a $${selectedAmount} card payment once a card processor is connected.`);
    // Real Stripe/Flutterwave/Paystack checkout goes here.
  }
});