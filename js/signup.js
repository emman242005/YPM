// ==========================================================================
// ROLE TOGGLE
// ==========================================================================
const roleParentBtn = document.getElementById('roleParentBtn');
const roleTeacherBtn = document.getElementById('roleTeacherBtn');
const parentForm = document.getElementById('parentForm');
const teacherForm = document.getElementById('teacherForm');

if (roleParentBtn && roleTeacherBtn) {
  roleParentBtn.addEventListener('click', () => {
    roleParentBtn.classList.add('active');
    roleTeacherBtn.classList.remove('active');
    parentForm.classList.remove('hidden');
    teacherForm.classList.add('hidden');
  });

  roleTeacherBtn.addEventListener('click', () => {
    roleTeacherBtn.classList.add('active');
    roleParentBtn.classList.remove('active');
    teacherForm.classList.remove('hidden');
    parentForm.classList.add('hidden');
  });
}

// ==========================================================================
// PARENT SIGNUP
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

    const childName = document.getElementById('cFullName').value;
    const childAge = document.getElementById('cAge').value;
    const childSchool = document.getElementById('cSchool').value;
    const program = document.getElementById('cProgram').value;
    const emergencyName = document.getElementById('eName').value;
    const emergencyPhone = document.getElementById('ePhone').value;
    const birthCertFile = document.getElementById('birthCert').files[0];

    try {
      // 1. Create the auth account
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: email,
        password: password
      });

      if (authError) throw authError;
      const userId = authData.user.id;

      // 2. Upload birth certificate to private storage
      const fileExt = birthCertFile.name.split('.').pop();
      const filePath = `${userId}/birth-certificate.${fileExt}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('child-documents')
        .upload(filePath, birthCertFile, { upsert: true });

      if (uploadError) throw uploadError;

      // 3. Insert parent record
      const { error: parentInsertError } = await supabaseClient
        .from('parents')
        .insert({
          id: userId,
          full_name: fullName,
          phone: phone,
          email: email
        });

      if (parentInsertError) throw parentInsertError;

      // 4. Insert child record (linked to parent)
      const { error: childInsertError } = await supabaseClient
        .from('children')
        .insert({
          parent_id: userId,
          full_name: childName,
          age: childAge,
          school: childSchool,
          program: program,
          emergency_contact_name: emergencyName,
          emergency_contact_phone: emergencyPhone,
          birth_certificate_url: filePath
        });

      if (childInsertError) throw childInsertError;

      note.textContent = "Account created! Redirecting to payment...";
      setTimeout(() => {
        window.location.href = "payment.html?role=parent";
      }, 1500);

    } catch (err) {
      note.textContent = "Error: " + err.message;
      console.error(err);
    }
  });
}

// ==========================================================================
// TEACHER SIGNUP
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
      const userId = authData.user.id;

      // Upload proof of teaching
      const proofExt = proofFile.name.split('.').pop();
      const proofPath = `${userId}/proof-of-teaching.${proofExt}`;
      const { error: proofUploadError } = await supabaseClient.storage
        .from('teacher-documents')
        .upload(proofPath, proofFile, { upsert: true });
      if (proofUploadError) throw proofUploadError;

      // Upload CV
      const cvExt = cvFile.name.split('.').pop();
      const cvPath = `${userId}/cv.${cvExt}`;
      const { error: cvUploadError } = await supabaseClient.storage
        .from('teacher-documents')
        .upload(cvPath, cvFile, { upsert: true });
      if (cvUploadError) throw cvUploadError;

      // Insert teacher record
      const { error: teacherInsertError } = await supabaseClient
        .from('teachers')
        .insert({
          id: userId,
          full_name: fullName,
          phone: phone,
          email: email,
          school: school,
          grade_level: grade,
          proof_of_teaching_url: proofPath,
          cv_url: cvPath
        });

      if (teacherInsertError) throw teacherInsertError;

      note.textContent = "Account created! Redirecting to payment...";
      setTimeout(() => {
        window.location.href = "payment.html?role=teacher";
      }, 1500);

    } catch (err) {
      note.textContent = "Error: " + err.message;
      console.error(err);
    }
  });
}