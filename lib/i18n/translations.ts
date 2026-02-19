export type Language = 'en' | 'hi'

export const translations = {
    en: {
        // Nav
        'nav.dashboard': 'Dashboard',
        'nav.resume': 'Resume',
        'nav.interview': 'Interview',
        'nav.jobs': 'Jobs',
        'nav.research': 'Research',
        'nav.logout': 'Logout',
        'nav.about': 'About',
        'nav.features': 'Features',
        'nav.login': 'Login',
        'nav.getStarted': 'Get Started',
        'nav.free': '100% Free',

        // Landing
        'hero.title1': 'Your AI-Powered',
        'hero.title2': 'Career Companion',
        'hero.subtitle': 'Transform your job search with intelligent resume building, AI-driven interview practice, and personalized job recommendations tailored for the Indian market.',
        'hero.cta': 'Start Your Journey',
        'hero.demo': 'Explore Features',
        'hero.badge': 'AI-Powered Career Platform',

        // Features
        'features.title': 'Everything You Need to Succeed',
        'features.subtitle': 'Powerful AI tools designed for the modern Indian job seeker',
        'features.resume.title': 'Smart Resume Builder',
        'features.resume.desc': 'Create ATS-optimized resumes with AI-powered suggestions and real-time scoring.',
        'features.interview.title': 'AI Interview Coach',
        'features.interview.desc': 'Practice with our AI interviewer and get detailed feedback on your responses.',
        'features.jobs.title': 'Job Aggregation',
        'features.jobs.desc': 'Access thousands of jobs from NCS, Jooble, and Adzuna in one place.',
        'features.research.title': 'Career Research',
        'features.research.desc': 'Get AI-powered insights on career trends, skills, and industry analysis.',

        // CTA
        'cta.title': 'Ready to Accelerate Your Career?',
        'cta.subtitle': 'Join thousands of job seekers who have found success with Catalyst. Completely free, no credit card required.',
        'cta.button': 'Get Started Free',

        // Auth
        'auth.backHome': 'Back to Home',
        'auth.login.title': 'Welcome back',
        'auth.login.subtitle': 'Enter your credentials to access your account',
        'auth.login.submit': 'Sign In',
        'auth.login.loading': 'Signing in...',
        'auth.login.noAccount': "Don't have an account?",
        'auth.login.signUp': 'Sign up',
        'auth.signup.title': 'Create an account',
        'auth.signup.subtitle': 'Get started with your AI-powered career journey',
        'auth.signup.submit': 'Create Account',
        'auth.signup.loading': 'Creating account...',
        'auth.signup.hasAccount': 'Already have an account?',
        'auth.signup.signIn': 'Sign in',
        'auth.orContinue': 'Or continue with',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.confirmPassword': 'Confirm Password',
        'auth.fullName': 'Full Name',
        'auth.checkEmail': 'Check your email!',
        'auth.verifyMsg': "We've sent a verification link to",
        'auth.spamHint': "Didn't receive it? Check your spam folder or",
        'auth.tryAgain': 'try again',

        // Callback
        'callback.completing': 'Completing sign-in…',
        'callback.verified': 'Email verified successfully!',
        'callback.redirecting': 'Redirecting to dashboard…',
        'callback.timeout': 'Authentication timed out. Please try signing in again.',
        'callback.backLogin': 'Back to Login',

        // Dashboard
        'dash.welcome': 'Welcome back',
        'dash.subtitle': "Here's what's happening with your career journey",
        'dash.resumes': 'Resumes',
        'dash.interviews': 'Interviews',
        'dash.savedJobs': 'Saved Jobs',
        'dash.profileViews': 'Profile Views',
        'dash.resumeBuilder': 'Resume Builder',
        'dash.resumeDesc': 'Create and optimize your resume with AI-powered suggestions',
        'dash.interviewPractice': 'Interview Practice',
        'dash.interviewDesc': 'Practice with our AI interviewer and get real-time feedback',
        'dash.jobSearch': 'Job Search',
        'dash.jobDesc': 'Find jobs from top Indian job boards in one place',
        'dash.careerResearch': 'Career Research',
        'dash.researchDesc': 'Get AI-powered insights on industries and career paths',
        'dash.analytics': 'Analytics',
        'dash.analyticsDesc': 'Track your progress and optimize your job search',
        'dash.settings': 'Settings',
        'dash.settingsDesc': 'Manage your profile, preferences, and integrations',

        // Resume Page
        'resume.title': 'Resume Tailor',
        'resume.subtitle': 'Paste your resume and a job description to get an AI-tailored version',
        'resume.inputLabel': 'Your Resume',
        'resume.jdLabel': 'Job Description',
        'resume.submit': 'Tailor My Resume',
        'resume.loading': 'Tailoring...',

        // Interview Page
        'interview.title': 'AI Interview Coach',
        'interview.subtitle': 'Practice interviews with our AI coach and get detailed feedback',

        // Jobs Page
        'jobs.title': 'Job Search',
        'jobs.subtitle': 'Search thousands of jobs from multiple Indian job boards',

        // Research Page
        'research.title': 'Career Research',
        'research.subtitle': 'Get AI-powered insights on companies, industries, and career paths',

        // About Page
        'about.title': 'About Catalyst',
        'about.mission.title': 'Our Mission',
        'about.mission.text': 'Catalyst (RozgarSathi) is built to democratize career growth for every Indian job seeker. We believe that AI-powered tools should be accessible to everyone, regardless of background or budget.',
        'about.vision.title': 'Our Vision',
        'about.vision.text': 'A future where every job seeker in India has access to the same quality career tools and guidance that was previously available only to the privileged few.',
        'about.stats.users': 'Active Users',
        'about.stats.resumes': 'Resumes Created',
        'about.stats.interviews': 'Interviews Practiced',
        'about.stats.jobs': 'Jobs Aggregated',
        'about.founder': 'Built by',
        'about.founderName': 'Ayaan Agarwal',
        'about.founderRole': 'Founder & Developer',
        'about.tech': 'Powered by cutting-edge AI',
        'about.techDesc': 'Built with Next.js, Google Gemini AI, and Supabase to deliver a fast, intelligent, and reliable experience.',

        // Features Page
        'featuresPage.title': 'Powerful Features',
        'featuresPage.subtitle': 'Everything you need to land your dream job, completely free',
        'featuresPage.resume.detail': 'Our AI analyzes your resume against the job description, calculates an ATS compatibility score, identifies missing skills, and generates a tailored version that highlights your relevant experience.',
        'featuresPage.interview.detail': 'Select your target role and interview type, then practice with AI-generated questions. Get detailed feedback on each answer with scores, suggestions, and model answers.',
        'featuresPage.jobs.detail': 'Search across NCS, Jooble, and Adzuna simultaneously. Filter by location, role, and experience level. Save interesting jobs and track your applications.',
        'featuresPage.research.detail': 'Research companies, industries, salary benchmarks, and career paths. Get AI-synthesized insights that help you make informed career decisions.',

        // Footer
        'footer.tagline': 'Empowering careers with AI technology',
        'footer.product': 'Product',
        'footer.company': 'Company',
        'footer.legal': 'Legal',
        'footer.privacy': 'Privacy',
        'footer.terms': 'Terms',
        'footer.contact': 'Contact',
        'footer.demo': 'Demo',
        'footer.copyright': '© 2025 Catalyst (RozgarSathi). All rights reserved.',
    },
    hi: {
        // Nav
        'nav.dashboard': 'डैशबोर्ड',
        'nav.resume': 'रिज़्यूमे',
        'nav.interview': 'इंटरव्यू',
        'nav.jobs': 'नौकरियाँ',
        'nav.research': 'रिसर्च',
        'nav.logout': 'लॉगआउट',
        'nav.about': 'हमारे बारे में',
        'nav.features': 'सुविधाएँ',
        'nav.login': 'लॉगिन',
        'nav.getStarted': 'शुरू करें',
        'nav.free': '100% मुफ़्त',

        // Landing
        'hero.title1': 'आपका AI-संचालित',
        'hero.title2': 'करियर साथी',
        'hero.subtitle': 'बुद्धिमान रिज़्यूमे निर्माण, AI-संचालित इंटरव्यू अभ्यास, और भारतीय बाज़ार के लिए व्यक्तिगत नौकरी सिफारिशों के साथ अपनी नौकरी खोज को बदलें।',
        'hero.cta': 'अपनी यात्रा शुरू करें',
        'hero.demo': 'सुविधाएँ देखें',
        'hero.badge': 'AI-संचालित करियर प्लेटफॉर्म',

        // Features
        'features.title': 'सफल होने के लिए सब कुछ',
        'features.subtitle': 'आधुनिक भारतीय नौकरी खोजने वालों के लिए शक्तिशाली AI उपकरण',
        'features.resume.title': 'स्मार्ट रिज़्यूमे बिल्डर',
        'features.resume.desc': 'AI-संचालित सुझावों और रियल-टाइम स्कोरिंग के साथ ATS-अनुकूलित रिज़्यूमे बनाएं।',
        'features.interview.title': 'AI इंटरव्यू कोच',
        'features.interview.desc': 'हमारे AI इंटरव्यूअर के साथ अभ्यास करें और अपने जवाबों पर विस्तृत प्रतिक्रिया प्राप्त करें।',
        'features.jobs.title': 'नौकरी एकत्रीकरण',
        'features.jobs.desc': 'NCS, Jooble और Adzuna से हज़ारों नौकरियों को एक ही जगह एक्सेस करें।',
        'features.research.title': 'करियर रिसर्च',
        'features.research.desc': 'करियर ट्रेंड्स, कौशल और उद्योग विश्लेषण पर AI-संचालित जानकारी प्राप्त करें।',

        // CTA
        'cta.title': 'अपने करियर को गति देने के लिए तैयार?',
        'cta.subtitle': 'हज़ारों नौकरी खोजने वालों में शामिल हों जिन्होंने Catalyst के साथ सफलता पाई है। पूरी तरह मुफ़्त, कोई क्रेडिट कार्ड नहीं।',
        'cta.button': 'मुफ़्त में शुरू करें',

        // Auth
        'auth.backHome': 'होम पर वापस जाएं',
        'auth.login.title': 'वापसी पर स्वागत है',
        'auth.login.subtitle': 'अपने खाते तक पहुंचने के लिए अपने क्रेडेंशियल दर्ज करें',
        'auth.login.submit': 'साइन इन करें',
        'auth.login.loading': 'साइन इन हो रहा है...',
        'auth.login.noAccount': 'खाता नहीं है?',
        'auth.login.signUp': 'साइन अप करें',
        'auth.signup.title': 'खाता बनाएं',
        'auth.signup.subtitle': 'अपनी AI-संचालित करियर यात्रा शुरू करें',
        'auth.signup.submit': 'खाता बनाएं',
        'auth.signup.loading': 'खाता बनाया जा रहा है...',
        'auth.signup.hasAccount': 'पहले से खाता है?',
        'auth.signup.signIn': 'साइन इन करें',
        'auth.orContinue': 'या इसके साथ जारी रखें',
        'auth.email': 'ईमेल',
        'auth.password': 'पासवर्ड',
        'auth.confirmPassword': 'पासवर्ड की पुष्टि करें',
        'auth.fullName': 'पूरा नाम',
        'auth.checkEmail': 'अपना ईमेल जांचें!',
        'auth.verifyMsg': 'हमने एक सत्यापन लिंक भेजा है',
        'auth.spamHint': 'नहीं मिला? अपना स्पैम फ़ोल्डर जांचें या',
        'auth.tryAgain': 'फिर से कोशिश करें',

        // Callback
        'callback.completing': 'साइन-इन पूरा हो रहा है…',
        'callback.verified': 'ईमेल सफलतापूर्वक सत्यापित!',
        'callback.redirecting': 'डैशबोर्ड पर भेजा जा रहा है…',
        'callback.timeout': 'प्रमाणीकरण का समय समाप्त। कृपया फिर से साइन इन करें।',
        'callback.backLogin': 'लॉगिन पर वापस जाएं',

        // Dashboard
        'dash.welcome': 'वापसी पर स्वागत है',
        'dash.subtitle': 'आपकी करियर यात्रा में क्या चल रहा है',
        'dash.resumes': 'रिज़्यूमे',
        'dash.interviews': 'इंटरव्यूज़',
        'dash.savedJobs': 'सेव्ड नौकरियाँ',
        'dash.profileViews': 'प्रोफ़ाइल व्यूज़',
        'dash.resumeBuilder': 'रिज़्यूमे बिल्डर',
        'dash.resumeDesc': 'AI-संचालित सुझावों के साथ अपना रिज़्यूमे बनाएं और अनुकूलित करें',
        'dash.interviewPractice': 'इंटरव्यू अभ्यास',
        'dash.interviewDesc': 'हमारे AI इंटरव्यूअर के साथ अभ्यास करें',
        'dash.jobSearch': 'नौकरी खोज',
        'dash.jobDesc': 'शीर्ष भारतीय जॉब बोर्ड्स से नौकरियाँ खोजें',
        'dash.careerResearch': 'करियर रिसर्च',
        'dash.researchDesc': 'उद्योगों और करियर पथों पर AI-संचालित जानकारी',
        'dash.analytics': 'एनालिटिक्स',
        'dash.analyticsDesc': 'अपनी प्रगति ट्रैक करें',
        'dash.settings': 'सेटिंग्स',
        'dash.settingsDesc': 'अपनी प्रोफ़ाइल और प्राथमिकताएं प्रबंधित करें',

        // Resume Page
        'resume.title': 'रिज़्यूमे टेलर',
        'resume.subtitle': 'अपना रिज़्यूमे और जॉब डिस्क्रिप्शन पेस्ट करें',
        'resume.inputLabel': 'आपका रिज़्यूमे',
        'resume.jdLabel': 'जॉब डिस्क्रिप्शन',
        'resume.submit': 'रिज़्यूमे तैयार करें',
        'resume.loading': 'तैयार हो रहा है...',

        // Interview Page
        'interview.title': 'AI इंटरव्यू कोच',
        'interview.subtitle': 'हमारे AI कोच के साथ इंटरव्यू का अभ्यास करें',

        // Jobs Page
        'jobs.title': 'नौकरी खोज',
        'jobs.subtitle': 'कई भारतीय जॉब बोर्ड्स से हज़ारों नौकरियाँ खोजें',

        // Research Page
        'research.title': 'करियर रिसर्च',
        'research.subtitle': 'कंपनियों, उद्योगों और करियर पथों पर AI-संचालित जानकारी',

        // About Page
        'about.title': 'Catalyst के बारे में',
        'about.mission.title': 'हमारा मिशन',
        'about.mission.text': 'Catalyst (रोज़गार साथी) हर भारतीय नौकरी खोजने वाले के लिए करियर विकास को लोकतांत्रिक बनाने के लिए बनाया गया है। हमारा मानना है कि AI-संचालित उपकरण सभी के लिए सुलभ होने चाहिए।',
        'about.vision.title': 'हमारी दृष्टि',
        'about.vision.text': 'एक ऐसा भविष्य जहाँ भारत में हर नौकरी खोजने वाले के पास वही गुणवत्ता वाले करियर उपकरण उपलब्ध हों।',
        'about.stats.users': 'सक्रिय उपयोगकर्ता',
        'about.stats.resumes': 'रिज़्यूमे बनाए गए',
        'about.stats.interviews': 'इंटरव्यू अभ्यास',
        'about.stats.jobs': 'नौकरियाँ एकत्रित',
        'about.founder': 'निर्माता',
        'about.founderName': 'अयान अग्रवाल',
        'about.founderRole': 'संस्थापक और डेवलपर',
        'about.tech': 'अत्याधुनिक AI द्वारा संचालित',
        'about.techDesc': 'तेज़, बुद्धिमान और विश्वसनीय अनुभव देने के लिए Next.js, Google Gemini AI और Supabase के साथ निर्मित।',

        // Features Page
        'featuresPage.title': 'शक्तिशाली सुविधाएँ',
        'featuresPage.subtitle': 'अपने सपनों की नौकरी पाने के लिए सब कुछ, पूरी तरह मुफ़्त',
        'featuresPage.resume.detail': 'हमारी AI आपके रिज़्यूमे का जॉब डिस्क्रिप्शन के अनुसार विश्लेषण करती है, ATS अनुकूलता स्कोर की गणना करती है, और एक अनुकूलित संस्करण तैयार करती है।',
        'featuresPage.interview.detail': 'अपनी लक्षित भूमिका और इंटरव्यू प्रकार चुनें, फिर AI-जनित प्रश्नों के साथ अभ्यास करें। प्रत्येक उत्तर पर विस्तृत प्रतिक्रिया प्राप्त करें।',
        'featuresPage.jobs.detail': 'NCS, Jooble और Adzuna में एक साथ खोजें। स्थान, भूमिका और अनुभव स्तर के अनुसार फ़िल्टर करें।',
        'featuresPage.research.detail': 'कंपनियों, उद्योगों, वेतन बेंचमार्क और करियर पथों पर रिसर्च करें। AI-संश्लेषित जानकारी प्राप्त करें।',

        // Footer
        'footer.tagline': 'AI तकनीक से करियर को सशक्त बनाना',
        'footer.product': 'उत्पाद',
        'footer.company': 'कंपनी',
        'footer.legal': 'कानूनी',
        'footer.privacy': 'गोपनीयता',
        'footer.terms': 'शर्तें',
        'footer.contact': 'संपर्क',
        'footer.demo': 'डेमो',
        'footer.copyright': '© 2025 Catalyst (रोज़गारसाथी)। सर्वाधिकार सुरक्षित।',
    },
} as const

export type TranslationKey = keyof typeof translations.en
