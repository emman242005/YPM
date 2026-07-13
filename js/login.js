const loginForm = document.getElementById('loginForm');
const loginNote = document.getElementById('loginNote');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginNote.textContent = "Logging in...";

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      const userId = data.user.id;

      // Check if this user is a parent or a teacher
      const { data: parentData } = await supabaseClient
        .from('parents')
        .select('id')
        .eq('id', userId)
        .single();

      if (parentData) {
        window.location.href = "dashboard-parent.html";
        return;
      }

      const { data: teacherData } = await supabaseClient
        .from('teachers')
        .select('id')
        .eq('id', userId)
        .single();

      if (teacherData) {
        window.location.href = "dashboard-teacher.html";
        return;
      }

      const { data: adminData } = await supabaseClient
        .from('admins')
        .select('id')
        .eq('id', userId)
        .single();

      if (adminData) {
        window.location.href = "admin-parents.html";
        return;
      }

      loginNote.textContent = "Account found, but no profile data matched. Contact support.";

    } catch (err) {
      loginNote.textContent = "Error: " + err.message;
      console.error(err);
    }
  });
}