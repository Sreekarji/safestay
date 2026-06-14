// List of verified Indian B.Tech college domains
const verifiedCollegeDomains = {
  // IITs
  'iitd.ac.in': 'IIT Delhi',
  'iitb.ac.in': 'IIT Bombay',
  'iitm.ac.in': 'IIT Madras',
  'iitkgp.ac.in': 'IIT Kharagpur',
  'iitk.ac.in': 'IIT Kanpur',
  'iitg.ac.in': 'IIT Guwahati',
  'iith.ac.in': 'IIT Hyderabad',
  'iitr.ac.in': 'IIT Roorkee',
  'iitbbs.ac.in': 'IIT Bhubaneswar',
  'iiti.ac.in': 'IIT Indore',
  'iitp.ac.in': 'IIT Patna',
  'iitj.ac.in': 'IIT Jodhpur',
  'iitgn.ac.in': 'IIT Gandhinagar',
  'iitmandi.ac.in': 'IIT Mandi',
  'iitdh.ac.in': 'IIT Dharwad',
  'iitbhilai.ac.in': 'IIT Bhilai',
  'iitgoa.ac.in': 'IIT Goa',
  'iitjammu.ac.in': 'IIT Jammu',
  'iitpkd.ac.in': 'IIT Palakkad',
  'iittirupati.ac.in': 'IIT Tirupati',
  
  // NITs
  'nitw.ac.in': 'NIT Warangal',
  'nitt.edu': 'NIT Trichy',
  'nitk.ac.in': 'NIT Karnataka',
  'mnnit.ac.in': 'MNNIT Allahabad',
  'vnit.ac.in': 'VNIT Nagpur',
  'nitc.ac.in': 'NIT Calicut',
  'manit.ac.in': 'MANIT Bhopal',
  'svnit.ac.in': 'SVNIT Surat',
  'mnit.ac.in': 'MNIT Jaipur',
  'nits.ac.in': 'NIT Silchar',
  'nitrkl.ac.in': 'NIT Rourkela',
  'nitdgp.ac.in': 'NIT Durgapur',
  'nita.ac.in': 'NIT Agartala',
  'nitp.ac.in': 'NIT Patna',
  'nitrr.ac.in': 'NIT Raipur',
  'nitj.ac.in': 'NIT Jalandhar',
  'nitsri.ac.in': 'NIT Srinagar',
  'nituk.ac.in': 'NIT Uttarakhand',
  'nitgoa.ac.in': 'NIT Goa',
  'nitm.ac.in': 'NIT Meghalaya',
  'nitnagaland.ac.in': 'NIT Nagaland',
  'nitmizoram.ac.in': 'NIT Mizoram',
  'nitsikkim.ac.in': 'NIT Sikkim',
  'nitap.ac.in': 'NIT Arunachal Pradesh',
  'nitdelhi.ac.in': 'NIT Delhi',
  'nitpy.ac.in': 'NIT Puducherry',
  'nitandhra.ac.in': 'NIT Andhra Pradesh',
  
  // IIITs
  'iiitd.ac.in': 'IIIT Delhi',
  'iiith.ac.in': 'IIIT Hyderabad',
  'iiitb.ac.in': 'IIIT Bangalore',
  'iiita.ac.in': 'IIIT Allahabad',
  'iiitdm.ac.in': 'IIITDM Jabalpur',
  'iiitdmj.ac.in': 'IIITDM Jabalpur',
  'iiitk.ac.in': 'IIIT Kancheepuram',
  'iiitkota.ac.in': 'IIIT Kota',
  'iiitl.ac.in': 'IIIT Lucknow',
  'iiitm.ac.in': 'IIIT Gwalior',
  'iiitn.ac.in': 'IIIT Nagpur',
  'iiitp.ac.in': 'IIIT Pune',
  'iiitr.ac.in': 'IIIT Ranchi',
  'iiits.ac.in': 'IIIT Sri City',
  'iiitsonepat.ac.in': 'IIIT Sonepat',
  'iiitv.ac.in': 'IIIT Vadodara',
  'iiitbh.ac.in': 'IIIT Bhagalpur',
  'iiitdwd.ac.in': 'IIIT Dharwad',
  'iiitkottayam.ac.in': 'IIIT Kottayam',
  'iiitkalyani.ac.in': 'IIIT Kalyani',
  'iiitmk.ac.in': 'IIIT Manipur',
  'iiitnr.ac.in': 'IIIT Naya Raipur',
  'iiituna.ac.in': 'IIIT Una',
  'iiitbhopal.ac.in': 'IIIT Bhopal',
  'iiitsurat.ac.in': 'IIIT Surat',
  'iiitagartala.ac.in': 'IIIT Agartala',
  'iiitraichur.ac.in': 'IIIT Raichur',
  'iiittiruchirappalli.ac.in': 'IIIT Tiruchirappalli',
  
  // Top Private Universities
  'bits-pilani.ac.in': 'BITS Pilani',
  'pilani.bits-pilani.ac.in': 'BITS Pilani',
  'goa.bits-pilani.ac.in': 'BITS Pilani Goa',
  'hyderabad.bits-pilani.ac.in': 'BITS Pilani Hyderabad',
  'vit.ac.in': 'VIT Vellore',
  'vitstudent.ac.in': 'VIT Vellore',
  'manipal.edu': 'Manipal Institute of Technology',
  'learner.manipal.edu': 'Manipal Institute of Technology',
  'thapar.edu': 'Thapar University',
  'srmist.edu.in': 'SRM Institute of Science and Technology',
  'srmuniv.ac.in': 'SRM University',
  'amity.edu': 'Amity University',
  'lpu.in': 'Lovely Professional University',
  'chitkara.edu.in': 'Chitkara University',
  'bennett.edu.in': 'Bennett University',
  'sharda.ac.in': 'Sharda University',
  'gitam.edu': 'GITAM University',
  'kluniversity.in': 'KL University',
  'snu.edu.in': 'Shiv Nadar University',
  'ashoka.edu.in': 'Ashoka University',
  'plaksha.edu.in': 'Plaksha University',
  'krea.edu.in': 'Krea University',
  'flame.edu.in': 'FLAME University',
  'sitpune.edu.in': 'Symbiosis Institute of Technology',
  
  // Delhi NCR
  'dtu.ac.in': 'Delhi Technological University',
  'nsut.ac.in': 'NSUT Delhi',
  'nsit.ac.in': 'Netaji Subhas Institute of Technology',
  'igdtuw.ac.in': 'IGDTUW Delhi',
  'jiit.ac.in': 'JIIT Noida',
  'galgotiasuniversity.edu.in': 'Galgotias University',
  'galgotiacollege.edu': 'Galgotias College',
  'aktu.ac.in': 'AKTU',
  'gbpuat.ac.in': 'GBPUAT Pantnagar',
  
  // Hyderabad Colleges
  'vce.ac.in': 'Vasavi College of Engineering',
  'cbit.ac.in': 'CBIT Hyderabad',
  'cvr.ac.in': 'CVR College of Engineering',
  'mgit.ac.in': 'MGIT Hyderabad',
  'griet.ac.in': 'GRIET Hyderabad',
  'cmrcet.ac.in': 'CMRCET Hyderabad',
  'vardhaman.org': 'Vardhaman College of Engineering',
  'snist.ac.in': 'Sreenidhi Institute of Science and Technology',
  'mjcollege.ac.in': 'MJ College of Engineering',
  'mlrinstitutions.ac.in': 'MLR Institute of Technology',
  'bvrit.ac.in': 'BVRIT Hyderabad',
  'bvrith.ac.in': 'BVRIT Hyderabad for Women',
  'vnrvjiet.ac.in': 'VNRVJIET',
  'jntuh.ac.in': 'JNTUH Hyderabad',
  'osmania.ac.in': 'Osmania University',
  'uceou.edu': 'University College of Engineering OU',
  'cse.iiit.ac.in': 'IIIT Hyderabad CSE',
  'students.iiit.ac.in': 'IIIT Hyderabad',
  'research.iiit.ac.in': 'IIIT Hyderabad',
  'kitsw.ac.in': 'KITSW Warangal',
  'anurag.edu.in': 'Anurag University',
  'mrec.ac.in': 'Malla Reddy Engineering College',
  'mrecw.ac.in': 'Malla Reddy Engineering College for Women',
  'kmit.in': 'KMIT Hyderabad',
  'ngit.ac.in': 'Neil Gogte Institute of Technology',
  'cvsr.ac.in': 'CVSR College of Engineering',
  'vjit.ac.in': 'Vidya Jyothi Institute of Technology',
  'sphoorthy.ac.in': 'Sphoorthy Engineering College',
  'lords.ac.in': 'Lords Institute of Engineering and Technology',
  
  // Bangalore Colleges
  'rvce.edu.in': 'RV College of Engineering',
  'bmsce.ac.in': 'BMS College of Engineering',
  'bmsit.ac.in': 'BMS Institute of Technology',
  'msrit.edu': 'MS Ramaiah Institute of Technology',
  'pes.edu': 'PES University',
  'pesu.pes.edu': 'PES University',
  'nie.ac.in': 'NIE Mysore',
  'sjce.ac.in': 'SJCE Mysore',
  'dsce.edu.in': 'Dayananda Sagar College of Engineering',
  'cmrit.ac.in': 'CMR Institute of Technology',
  'nmit.ac.in': 'Nitte Meenakshi Institute of Technology',
  'rnsit.ac.in': 'RNS Institute of Technology',
  'cit.edu.in': 'Cambridge Institute of Technology',
  'jssateb.ac.in': 'JSS Academy of Technical Education',
  'sirmvit.edu': 'Sir MVIT Bangalore',
  'nhce.ac.in': 'New Horizon College of Engineering',
  'gitam.in': 'GITAM Bangalore',
  
  // Chennai/Tamil Nadu
  'annauniv.edu': 'Anna University',
  'ceg.annauniv.edu': 'College of Engineering Guindy',
  'mit.annauniv.edu': 'MIT Anna University',
  'act.annauniv.edu': 'ACT Anna University',
  'ssn.edu.in': 'SSN College of Engineering',
  'psgtech.edu': 'PSG College of Technology',
  'tce.edu': 'Thiagarajar College of Engineering',
  'nitt.edu': 'NIT Trichy',
  'srmuniv.edu.in': 'SRM University',
  'vit.ac.in': 'VIT Chennai',
  'svce.ac.in': 'Sri Venkateswara College of Engineering',
  'sairam.edu.in': 'Sri Sairam Engineering College',
  'rajalakshmi.org': 'Rajalakshmi Engineering College',
  'saveetha.ac.in': 'Saveetha Engineering College',
  'kct.ac.in': 'Kumaraguru College of Technology',
  'licet.ac.in': 'Loyola ICAM College of Engineering',
  'easwari.ac.in': 'Easwari Engineering College',
  'jeppiaarinstitute.org': 'Jeppiaar Engineering College',
  
  // Mumbai/Maharashtra
  'coep.ac.in': 'COEP Pune',
  'vjti.ac.in': 'VJTI Mumbai',
  'pict.edu': 'PICT Pune',
  'mitpune.edu.in': 'MIT Pune',
  'mitindia.edu': 'MIT Pune',
  'spit.ac.in': 'Sardar Patel Institute of Technology',
  'djsce.ac.in': 'DJ Sanghvi College of Engineering',
  'thadomal.org': 'Thadomal Shahani Engineering College',
  'somaiya.edu': 'KJ Somaiya College of Engineering',
  'vesit.edu': 'Vivekanand Education Society',
  'sakec.ac.in': 'Shah & Anchor Kutchhi Engineering College',
  'fcrit.ac.in': 'FR. Conceicao Rodrigues Institute of Technology',
  'xaviers.edu.in': "St. Xavier's College",
  'rait.ac.in': 'Ramrao Adik Institute of Technology',
  'pccoer.com': 'PCCOE Ravet',
  'sinhgad.edu': 'Sinhgad Institutes',
  'cummins.edu.in': 'Cummins College of Engineering for Women',
  'pvgcoet.ac.in': 'PVG College of Engineering',
  
  // West Bengal
  'jaduniv.edu.in': 'Jadavpur University',
  'iiests.ac.in': 'IIEST Shibpur',
  'iem.edu.in': 'Institute of Engineering and Management',
  'uem.edu.in': 'University of Engineering and Management',
  'bcrec.ac.in': 'BC Roy Engineering College',
  'hfrp.ac.in': 'Hooghly Engineering & Technology College',
  'klyuniv.ac.in': 'University of Kalyani',
  'makautexam.net': 'MAKAUT West Bengal',
  'rcciit.org': 'RCC Institute of Information Technology',
  'msit.edu.in': 'Meghnad Saha Institute of Technology',
  'jiscollege.ac.in': 'JIS College of Engineering',
  'gnit.ac.in': 'Guru Nanak Institute of Technology',
  'heritage.ac.in': 'Heritage Institute of Technology',
  'techno.ac.in': 'Techno Main Salt Lake',
  'aot.edu.in': 'Academy of Technology',
  
  // Other States
  'iisc.ac.in': 'IISc Bangalore',
  'iiserkol.ac.in': 'IISER Kolkata',
  'iiserpune.ac.in': 'IISER Pune',
  'iiserbpr.ac.in': 'IISER Bhopal',
  'iisermohali.ac.in': 'IISER Mohali',
  'iisertvm.ac.in': 'IISER Thiruvananthapuram',
  'iisertirupati.ac.in': 'IISER Tirupati',
  'iiserbr.ac.in': 'IISER Berhampur',
  'cusat.ac.in': 'CUSAT Kerala',
  'nitpy.ac.in': 'NIT Puducherry',
  'pondiuni.edu.in': 'Pondicherry University',
  'bhu.ac.in': 'Banaras Hindu University',
  'itbhu.ac.in': 'IIT BHU',
  'iitbhu.ac.in': 'IIT BHU',
  'du.ac.in': 'Delhi University',
  'ipu.ac.in': 'IP University Delhi',
  'uohyd.ac.in': 'University of Hyderabad',
  'hcu.ac.in': 'University of Hyderabad',
  'bitmesra.ac.in': 'BIT Mesra',
  'birlainstituteoftech.ac.in': 'BIT Mesra',
  'rgipt.ac.in': 'RGIPT Amethi',
  'iiitranchi.ac.in': 'IIIT Ranchi',
  'iiitdmk.ac.in': 'IIITDM Kancheepuram',
  
  // Generic patterns for state universities
  'gcet.ac.in': 'Government College of Engineering and Technology',
  'geu.ac.in': 'Graphic Era University',
  'gbu.ac.in': 'Gautam Buddha University',
  'mdu.ac.in': 'Maharshi Dayanand University',
  'ptu.ac.in': 'Punjab Technical University',
  'gtu.ac.in': 'Gujarat Technological University',
  'rgpv.ac.in': 'RGPV Bhopal',
  'uptu.ac.in': 'UPTU/AKTU',
  'sppu.ac.in': 'Savitribai Phule Pune University',
  'unipune.ac.in': 'Pune University',
  'mu.ac.in': 'Mumbai University',
  'vtu.ac.in': 'VTU Karnataka',
  'ktu.edu.in': 'KTU Kerala',
  'caluniv.ac.in': 'University of Calcutta',
};

// Common education domain patterns (fallback)
const educationPatterns = [
  '.ac.in',      // Most Indian colleges
  '.edu.in',     // Educational institutions
  '.edu',        // International universities
  '.ernet.in',   // Education network
  '.res.in',     // Research institutions
];

/**
 * Check if email is from a verified college
 * @param {string} email - User's email address
 * @returns {object} - { isVerified: boolean, collegeName: string|null }
 */
function checkCollegeEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isVerified: false, collegeName: null };
  }

  const emailLower = email.toLowerCase().trim();
  const domain = emailLower.split('@')[1];

  if (!domain) {
    return { isVerified: false, collegeName: null };
  }

  // 1. Check exact domain match (specific colleges)
  if (verifiedCollegeDomains[domain]) {
    return {
      isVerified: true,
      collegeName: verifiedCollegeDomains[domain]
    };
  }

  // 2. Check subdomain (e.g., student.vce.ac.in)
  const domainParts = domain.split('.');
  for (let i = 1; i < domainParts.length; i++) {
    const parentDomain = domainParts.slice(i).join('.');
    if (verifiedCollegeDomains[parentDomain]) {
      return {
        isVerified: true,
        collegeName: verifiedCollegeDomains[parentDomain]
      };
    }
  }

  // 3. Check for common education patterns
  for (const pattern of educationPatterns) {
    if (domain.endsWith(pattern)) {
      // Extract college name from domain (best effort)
      const collegeName = domain
        .replace(pattern, '')
        .split('.')
        .filter(part => part.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return {
        isVerified: true,
        collegeName: collegeName || 'Educational Institution'
      };
    }
  }

  // 4. Not a college email
  return { isVerified: false, collegeName: null };
}

/**
 * Get all verified college domains
 * @returns {object} - Object with domain as key and college name as value
 */
function getVerifiedDomains() {
  return verifiedCollegeDomains;
}

/**
 * Add a new college domain
 * @param {string} domain - Domain to add
 * @param {string} collegeName - Name of the college
 */
function addCollegeDomain(domain, collegeName) {
  verifiedCollegeDomains[domain.toLowerCase()] = collegeName;
}

module.exports = {
  checkCollegeEmail,
  getVerifiedDomains,
  addCollegeDomain,
  verifiedCollegeDomains
};