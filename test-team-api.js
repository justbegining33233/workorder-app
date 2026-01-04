const testTeamAPI = async () => {
  try {
    console.log('🧪 Testing /api/shop/team endpoint...\n');
    
    // Login as shop owner first
    const loginResponse = await fetch('http://localhost:3000/api/auth/shop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@prism1.com',
        password: 'Test123!'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Logged in as:', loginData.shopName);
    console.log('   Shop ID:', loginData.id);
    console.log('   Token:', loginData.accessToken.substring(0, 20) + '...\n');
    
    // Test team endpoint
    const teamResponse = await fetch(`http://localhost:3000/api/shop/team?shopId=${loginData.id}`, {
      headers: { 
        'Authorization': `Bearer ${loginData.accessToken}`
      }
    });
    
    if (!teamResponse.ok) {
      console.error('❌ Team API failed:', teamResponse.status, await teamResponse.text());
      return;
    }
    
    const teamData = await teamResponse.json();
    console.log('✅ Team data received:\n');
    console.log(`👥 Total team members: ${teamData.team.length}\n`);
    
    teamData.team.forEach((member, idx) => {
      console.log(`${idx + 1}. ${member.name} (${member.role})`);
      console.log(`   Email: ${member.email}`);
      console.log(`   Rate: $${member.hourlyRate || 'N/A'}/hr`);
      console.log(`   Status: ${member.isClockedIn ? '🟢 CLOCKED IN' : '⚪ Clocked out'}`);
      
      if (member.isClockedIn) {
        console.log(`   Session: ${Math.floor(member.currentSessionMinutes / 60)}h ${member.currentSessionMinutes % 60}m`);
        console.log(`   Since: ${new Date(member.clockedInAt).toLocaleTimeString()}`);
        if (member.onBreak) console.log(`   ☕ ON BREAK`);
      }
      
      console.log(`   Weekly: ${member.weeklyHours}h (${member.recentShifts} shifts)`);
      
      if (member.clockedInLocation) {
        console.log(`   Location: ${member.clockedInLocation}`);
      }
      if (member.clockedInNotes) {
        console.log(`   Notes: ${member.clockedInNotes}`);
      }
      
      console.log('');
    });
    
    // Summary
    const clockedIn = teamData.team.filter(m => m.isClockedIn);
    const totalWeeklyHours = teamData.team.reduce((sum, m) => sum + m.weeklyHours, 0);
    const managers = teamData.team.filter(m => m.role === 'manager');
    
    console.log('📊 SUMMARY:');
    console.log(`   Total Members: ${teamData.team.length}`);
    console.log(`   Clocked In Now: ${clockedIn.length}`);
    console.log(`   Total Weekly Hours: ${totalWeeklyHours.toFixed(1)}h`);
    console.log(`   Managers: ${managers.length}`);
    console.log(`   Technicians: ${teamData.team.length - managers.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testTeamAPI();
