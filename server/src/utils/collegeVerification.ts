// 250+ Indian college email domains for verification
// Students with these email domains are automatically verified as college students

const COLLEGE_DOMAINS: string[] = [
  // IITs (Indian Institutes of Technology)
  'iitb.ac.in', 'iitd.ac.in', 'iitkgp.ac.in', 'iitk.ac.in', 'iitm.ac.in',
  'iitg.ac.in', 'iitropar.ac.in', 'iith.ac.in', 'iitj.ac.in', 'iitp.ac.in',
  'iitbhu.ac.in', 'iitgn.ac.in', 'iitmacademy.ac.in', 'iitmandi.ac.in',
  'iitjammu.ac.in', 'iittirupati.ac.in', 'iitbhilai.ac.in', 'iitpalakkad.ac.in',
  'iitdharwad.ac.in', 'iisertvm.ac.in', 'iiserpune.ac.in', 'iiserkol.ac.in',
  'iiserb.ac.in', 'iiserm.ac.in', 'iisers.ac.in',

  // NITs (National Institutes of Technology)
  'nitc.ac.in', 'nitw.ac.in', 'nitk.ac.in', 'nittrichy.ac.in', 'nits.ac.in',
  'nitkkr.ac.in', 'nitd.ac.in', 'nitj.ac.in', 'nitp.ac.in', 'nitb.ac.in',
  'nitgoa.ac.in', 'nitjsr.ac.in', 'nitmanipur.ac.in', 'nitmz.ac.in',
  'nitnagaland.ac.in', 'nitap.ac.in', 'nitm.ac.in', 'nitrr.ac.in',
  'nitkkr.ac.in', 'nits.ac.in', 'nitw.ac.in', 'nitcalicut.ac.in',
  'nitdurgapur.ac.in', 'nitjamshedpur.ac.in', 'nitkurukshetra.ac.in',
  'nitlucknow.ac.in', 'nitpatna.ac.in', 'nitraipur.ac.in', 'nitsilchar.ac.in',
  'nituk.ac.in', 'nitwarangal.ac.in',

  // IIITs (Indian Institutes of Information Technology)
  'iiit.ac.in', 'iiith.ac.in', 'iiita.ac.in', 'iiitb.ac.in', 'iiitm.ac.in',
  'iiitd.ac.in', 'iiitk.ac.in', 'iiits.ac.in', 'iiitl.ac.in', 'iiitn.ac.in',
  'iiitp.ac.in', 'iiitr.ac.in', 'iiitu.ac.in', 'iiitv.ac.in', 'iiitbh.ac.in',
  'iiitkalyani.ac.in', 'iiitnr.ac.in', 'iiitdm.ac.in', 'iiitdm.ac.in',
  'iiitmunich.ac.in', 'iiitsonepat.ac.in', 'iiitkurnool.ac.in',

  // BITS
  'bits-pilani.ac.in', 'bitsDubai.ac.in', 'bitsHyderabad.ac.in', 'bitsgoa.ac.in',

  // VIT
  'vit.ac.in', 'vitbhopal.ac.in', 'vitvellore.ac.in', 'vitchennai.ac.in',
  'vitap.ac.in', 'vitvellore.ac.in',

  // Manipal
  'manipal.edu', 'manipalotn.ac.in', 'manipalbhopal.ac.in',

  // SRM
  'srmist.edu.in', 'srmuniv.ac.in', 'srmvist.ac.in',

  // Amrita
  'amrita.edu', 'amrita.ac.in',

  // Lovely Professional University
  'lpu.co.in', 'lpu.in',

  // Shiv Nadar
  'snu.edu.in', 'shivnadar.edu.in',

  // Plaksha
  'plaksha.edu.in',

  // Ashoka
  'ashoka.edu.in',

  // Krea
  'krea.edu.in',

  // flame
  'flame.edu.in',

  // BML Munjal
  'bmu.edu.in',

  // Mahindra University
  'mahindrauniversity.edu.in',

  // State Universities - Andhra Pradesh
  'jntuh.ac.in', 'jntua.ac.in', 'jntuk.ac.in', 'auvsp.edu.in',
  'skuast.ac.in', 'svu.edu.in', 'aku.edu.in', 'dpucet.ac.in',
  'andhrauniversity.edu.in', 'kluniversity.in',

  // State Universities - Telangana
  'osmania.ac.in', 'uohyd.ac.in', 'tsu.in', 'palamuru.ac.in',
  'mguit.ac.in', 'jntuh.ac.in', 'kakatiya.ac.in', 'ntu.ac.in',
  'pusru.ac.in', 'srttu.ac.in',

  // State Universities - Karnataka
  'bangaloreuniversity.ac.in', 'dukarwad.ac.in', 'vtu.ac.in',
  'Christuniversity.in', 'stjosephs.ac.in', 'msruas.ac.in',
  'bmsce.ac.in', 'rvce.ac.in', 'pes.edu', 'dsce.edu.in',
  'bmsit.ac.in', 'nitte.edu.in', 'srmvist.ac.in',

  // State Universities - Tamil Nadu
  'annauniv.edu', 'satyamuniv.edu.in', 'vit.ac.in', 'srmist.edu.in',
  'loyolacollege.edu', 'presidencycollege.edu', 'madrasuniversity.net',
  'bdu.ac.in', 'nITTtr.ac.in',

  // State Universities - Maharashtra
  'mu.ac.in', 'pict.edu', 'coep.ac.in', 'vjti.ac.in',
  'spce.ac.in', 'kjsce.ac.in', 'vesit.ac.in', 'sjsce.ac.in',
  'ymbcollegemngt.org', 'frcrce.ac.in',

  // State Universities - Gujarat
  'gtu.ac.in', 'dau.ac.in', 'nirmauni.ac.in', 'pdpu.ac.in',
  'cept.ac.in', 'lkouniv.ac.in',

  // State Universities - Rajasthan
  'rtu.ac.in', 'jnujaipur.ac.in', 'mnit.ac.in', 'iiitdms.ac.in',
  'aryacollege.org', 'lnmiit.ac.in',

  // State Universities - West Bengal
  'ju.ac.in', 'wbnu.ac.in', 'jadavpuruniversity.net', 'caluniv.ac.in',
  'heritageit.edu.in', 'iemcal.com',

  // State Universities - Delhi
  'du.ac.in', 'ipu.ac.in', 'nsit.ac.in', 'dtu.ac.in',
  'jmiu.ac.in', 'ambedkaruniversity.ac.in',

  // State Universities - Uttar Pradesh
  'aktu.ac.in', 'bhu.ac.in', 'allduniv.ac.in', 'csjmu.ac.in',
  'lu.ac.in', 'mmmut.ac.in',

  // State Universities - Madhya Pradesh
  'davv.ac.in', 'bhopaluniversity.ac.in', 'lnct.ac.in',
  'amity.edu', 'sage.edu.in',

  // State Universities - Kerala
  'keralauniversity.ac.in', 'cusat.ac.in', 'calicutuniversity.ac.in',
  'mguniversity.ac.in', 'nitrkl.ac.in',

  // State Universities - Punjab
  'ptu.ac.in', 'puchd.ac.in', 'thapar.edu',
  'lpu.co.in', 'ctuniv.in',

  // State Universities - Haryana
  'gdgoenkauniversity.com', 'krmu.edu.in', 'niituniversity.in',
  'amity.edu', 'jmit.ac.in',

  // State Universities - Odisha
  'bput.ac.in', 'cet.edu.in', 'kit.ac.in', 'riit.ac.in',
  'gitam.in', 'kiit.ac.in',

  // State Universities - Assam
  'dibru.ac.in', 'gauhati.ac.in', 'tezu.ernet.in',

  // State Universities - Bihar
  'bpu.ac.in', 'lnmu.ac.in', 'magadhuniversity.ac.in',

  // State Universities - Chhattisgarh
  'csvtu.ac.in', 'biit.ac.in',

  // State Universities - Jharkhand
  'vksu.ac.in', 'ranchiuniversity.ac.in', 'bitmesra.ac.in',

  // State Universities - Goa
  'goa.ac.in',

  // State Universities - Himachal Pradesh
  'hpuniv.ac.in', 'nith.ac.in',

  // State Universities - Jammu & Kashmir
  'juets.ac.in', 'kashmiruniversity.net',

  // State Universities - Uttarakhand
  'uttarakhandtechnicaluniversity.org', 'gbpuat.ac.in',

  // State Universities - Sikkim
  'sikkimunit.ac.in',

  // State Universities - Meghalaya
  'nehu.ac.in',

  // State Universities - Mizoram
  'mzu.ac.in',

  // State Universities - Nagaland
  'nagalanduniversity.ac.in',

  // State Universities - Manipur
  'manipuruniv.ac.in',

  // State Universities - Tripura
  'tripurauniv.ac.in',

  // State Universities - Arunachal Pradesh
  'rgmu.ac.in',

  // Private Engineering Colleges
  'srmvist.ac.in', 'vit.ac.in', 'manipal.edu', 'thapar.edu',
  'bits-pilani.ac.in', 'iiit.ac.in', 'amrita.edu', 'snu.edu.in',
  'ashoka.edu.in', 'krea.edu.in', 'flame.edu.in', 'plaksha.edu.in',
  'bmu.edu.in', 'mahindrauniversity.edu.in',

  // Medical Colleges
  'aiims.ac.in', 'cmc.ac.in', 'jipmer.gov.in', 'aiimsbhopal.gov.in',
  'aiimsjodhpur.gov.in', 'aiimsraipur.gov.in', 'aiimstrivandrum.gov.in',

  // Law Colleges
  'nludelhi.ac.in', 'nalsar.ac.in', 'nlu.ac.in', 'bci.ac.in',

  // Architecture Colleges
  'spa.ac.in', 'cept.ac.in',

  // IIMs (for MBA students)
  'iima.ac.in', 'iimb.ac.in', 'iimc.ac.in', 'iiml.ac.in', 'iimk.ac.in',
  'iimcal.ac.in', 'iimrohtak.ac.in', 'iimraipur.ac.in', 'iimk.ac.in',
  'iimtiruchirappalli.ac.in', 'iimambabad.ac.in',

  // IISc
  'iisc.ac.in',

  // ISI
  'isical.ac.in',

  // TIFR
  'tifr.res.in',

  // Common patterns
  '.ac.in', '.edu.in',
];

/**
 * Check if an email domain is a verified Indian college domain
 */
export const isCollegeEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();

  if (!domain) return false;

  // Exact match check
  if (COLLEGE_DOMAINS.includes(domain)) return true;

  // Pattern match for .ac.in and .edu.in domains
  if (domain.endsWith('.ac.in') || domain.endsWith('.edu.in')) {
    return true;
  }

  return false;
};

/**
 * Extract college name from email domain
 */
export const extractCollegeFromEmail = (email: string): string | null => {
  const domain = email.split('@')[1]?.toLowerCase();

  if (!domain) return null;

  // Try to extract a readable name from domain
  const parts = domain.split('.')[0];
  return parts.toUpperCase();
};

/**
 * Get all supported college domains (for display)
 */
export const getSupportedDomains = (): string[] => {
  return [...new Set(COLLEGE_DOMAINS)].sort();
};
