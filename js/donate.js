let selectedAmount = 0;

const amountBtns = document.querySelectorAll('.amount-btn');
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

// Method tab switching
const methodTabBtns = document.querySelectorAll('.method-tab-btn');
methodTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    methodTabBtns.forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.method-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.method + 'Panel').classList.add('active');
  });
});

function validateAmount() {
  if (selectedAmount < 2 || isNaN(selectedAmount)) {
    alert('Please select or enter an amount of at least $2.');
    return false;
  }
  return true;
}

document.getElementById('paypalBtn').addEventListener('click', () => {
  if (!validateAmount()) return;
  alert(`This will redirect to PayPal to donate $${selectedAmount} once PayPal is connected.`);
  // Real PayPal integration goes here, e.g. redirecting to a PayPal.me link
  // or using PayPal's Donate Button SDK with the selectedAmount.
});

document.getElementById('momoBtn').addEventListener('click', () => {
  if (!validateAmount()) return;
  const momoNumber = document.getElementById('momoNumber').value;
  if (!momoNumber) {
    alert('Please enter your MTN Mobile Money number.');
    return;
  }
  alert(`This will charge $${selectedAmount} to ${momoNumber} once MTN MoMo Collections is connected.`);
  // Real MTN MoMo API call goes here.
});

document.getElementById('cardBtn').addEventListener('click', () => {
  if (!validateAmount()) return;
  alert(`This will process a $${selectedAmount} card payment once a card processor is connected.`);
  // Real Stripe/Flutterwave/Paystack checkout goes here.
});