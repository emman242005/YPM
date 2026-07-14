// ==========================================================================
// ROLE TOGGLE
// ==========================================================================
const roleParentBtn = document.getElementById('roleParentBtn');
const roleTeacherBtn = document.getElementById('roleTeacherBtn');
const parentForm = document.getElementById('parentForm');
const teacherForm = document.getElementById('teacherForm');
const otpScreen = document.getElementById('otpScreen');

if (roleParentBtn && roleTeacherBtn) {
  roleParentBtn.addEventListener('click', () => {
    roleParentBtn.classList.add('active');
    roleTeacherBtn.classList.remove('active');
    parentForm.classList.remove('hidden');
    teacherForm.classList.add('hidden');
    otpScreen.classList.add('hidden');
  });

  roleTeacherBtn.addEventListener('click', () => {
    roleTeacherBtn.classList.add('active');
    roleParentBtn.classList.remove('active');
    teacherForm.classList.remove('hidden');
    parentForm.classList.add('hidden');
    otpScreen.classList.add('hidden');
  });
}

// Holds form data between Phase 1 (account creation) and Phase 2 (after OTP verified)
let pendingRole = null;
let pendingEmail = null;
let pendingParentData = null;
let pendingTeacherData = null;

// ==========================================================================
// PARENT SIGNUP — PHASE 1: create account, send to OTP screen
// ==========================================================================
if (parentForm) {
  parentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = document.getElementById('parentNote');
    note.textContent = "Creating your account...";

    const fullName = document.getElementById('pFullName').value;
    const phone = document.getElementById('pPhone').value;
    const email = document.getElementById('pEmail').value;
    const password = document.getElementById('pPassword').value;
    const idCardFile = document.getElementById('pIdCard').files[0];

    const childName = document.getElementById('cFullName').value;
    const childAge = document.getElementById('cAge').value;
    const childSchool = document.getElementById('cSchool').value;
    const program = document.getElementById('cProgram').value;
    const emergencyName = document.getElementById('eName').value;
    const emergencyPhone = document.getElementById('ePhone').value;
    const birthCertFile = document.getElementById('birthCert').files[0];

    try {
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: email,
        password: password
      });

      if (authError) throw authError;

      pendingRole = 'parent';
      pendingEmail = email;
      pendingParentData = {
        fullName, phone, email, idCardFile,
        childName, childAge, childSchool, program,
        emergencyName, emergencyPhone, birthCertFile
      };

      document.getElementById('otpEmailDisplay').textContent = email;
      parentForm.classList.add('hidden');
      otpScreen.classList.remove('hidden');
      note.textContent = "";

    } catch (err) {
      note.textContent = "Error: " + err.message;
      console.error(err);
    }
  });
}

// ==========================================================================
// TEACHER SIGNUP — PHASE 1: create account, send to OTP screen
// ==========================================================================
if (teacherForm) {
  teacherForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = document.getElementById('teacherNote');
    note.textContent = "Creating your account...";

    const fullName = document.getElementById('tFullName').value;
    const phone = document.getElementById('tPhone').value;
    const email = document.getElementById('tEmail').value;
    const password = document.getElementById('tPassword').value;
    const school = document.getElementById('tSchool').value;
    const grade = document.getElementById('tGrade').value;
    const proofFile = document.getElementById('tProof').files[0];
    const cvFile = document.getElementById('tCV').files[0];

    try {
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: email,
        password: password
      });

      if (authError) throw authError;

      pendingRole = 'teacher';
      pendingEmail = email;
      pendingTeacherData = {
        fullName, phone, email, school, grade, proofFile, cvFile
      };

      document.getElementById('otpEmailDisplay').textContent = email;
      teacherForm.classList.add('hidden');
      otpScreen.classList.remove('hidden');
      note.textContent = "";

    } catch (err) {
      note.textContent = "Error: " + err.message;
      console.error(err);
    }
  });
}

// ==========================================================================
// OTP VERIFICATION — PHASE 2: verify code, then upload docs + insert records
// ==========================================================================
const otpSubmitBtn = document.getElementById('otpSubmitBtn');
const otpNote = document.getElementById('otpNote');

if (otpSubmitBtn) {
  otpSubmitBtn.addEventListener('click', async () => {
    const code = document.getElementById('otpCode').value.trim();

    if (!code || code.length < 6) {
      otpNote.textContent = "Please enter the full code.";
      return;
    }

    otpNote.textContent = "Verifying...";

    try {
      const { data, error } = await supabaseClient.auth.verifyOtp({
        email: pendingEmail,
        token: code,
        type: 'signup'
      });

      if (error) throw error;

      const userId = data.user.id;
      otpNote.textContent = "Email verified! Finishing your registration...";

      if (pendingRole === 'parent') {
        await finishParentRegistration(userId);
      } else if (pendingRole === 'teacher') {
        await finishTeacherRegistration(userId);
      }

    } catch (err) {
      otpNote.textContent = "Error: " + err.message;
      console.error(err);
    }
  });
}

async function finishParentRegistration(userId) {
  const d = pendingParentData;

  const fileExt = d.birthCertFile.name.split('.').pop();
  const filePath = `${userId}/birth-certificate.${fileExt}`;
  const { error: uploadError } = await supabaseClient.storage
    .from('child-documents')
    .upload(filePath, d.birthCertFile, { upsert: true });
  if (uploadError) { otpNote.textContent = "Error: " + uploadError.message; return; }

  const idExt = d.idCardFile.name.split('.').pop();
  const idPath = `${userId}/id-card.${idExt}`;
  const { error: idUploadError } = await supabaseClient.storage
    .from('child-documents')
    .upload(idPath, d.idCardFile, { upsert: true });
  if (idUploadError) { otpNote.textContent = "Error: " + idUploadError.message; return; }

  const { error: parentInsertError } = await supabaseClient
    .from('parents')
    .insert({ id: userId, full_name: d.fullName, phone: d.phone, email: d.email, id_card_url: idPath });
  if (parentInsertError) { otpNote.textContent = "Error: " + parentInsertError.message; return; }

  const { error: childInsertError } = await supabaseClient
    .from('children')
    .insert({
      parent_id: userId, full_name: d.childName, age: d.childAge, school: d.childSchool,
      program: d.program, emergency_contact_name: d.emergencyName,
      emergency_contact_phone: d.emergencyPhone, birth_certificate_url: filePath
    });
  if (childInsertError) { otpNote.textContent = "Error: " + childInsertError.message; return; }

  otpNote.textContent = "All done! Redirecting to payment...";
  setTimeout(() => { window.location.href = "payment.html?role=parent"; }, 1200);
}

async function finishTeacherRegistration(userId) {
  const d = pendingTeacherData;

  const proofExt = d.proofFile.name.split('.').pop();
  const proofPath = `${userId}/proof-of-teaching.${proofExt}`;
  const { error: proofUploadError } = await supabaseClient.storage
    .from('teacher-documents')
    .upload(proofPath, d.proofFile, { upsert: true });
  if (proofUploadError) { otpNote.textContent = "Error: " + proofUploadError.message; return; }

  const cvExt = d.cvFile.name.split('.').pop();
  const cvPath = `${userId}/cv.${cvExt}`;
  const { error: cvUploadError } = await supabaseClient.storage
    .from('teacher-documents')
    .upload(cvPath, d.cvFile, { upsert: true });
  if (cvUploadError) { otpNote.textContent = "Error: " + cvUploadError.message; return; }

  const { error: teacherInsertError } = await supabaseClient
    .from('teachers')
    .insert({
      id: userId, full_name: d.fullName, phone: d.phone, email: d.email,
      school: d.school, grade_level: d.grade, proof_of_teaching_url: proofPath, cv_url: cvPath
    });
  if (teacherInsertError) { otpNote.textContent = "Error: " + teacherInsertError.message; return; }

  otpNote.textContent = "All done! Redirecting to payment...";
  setTimeout(() => { window.location.href = "payment.html?role=teacher"; }, 1200);
}