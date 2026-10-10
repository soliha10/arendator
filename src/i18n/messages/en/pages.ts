import type uz from '../uz/pages'

const pages: typeof uz = {
  common: {
    updated: 'Last updated: {date}',
    updatedDate: 'October 2026',
  },
  notFound: {
    title: 'Page not found',
    text: 'The page you are looking for may have been removed or the address may be incorrect. The listing may also have been archived.',
    home: 'Home',
    listings: 'Browse listings',
  },
  error: {
    title: 'Something went wrong',
    text: 'An unexpected error occurred. Please reload the page — if the problem persists, contact us.',
    code: 'Error code: {code}',
    retry: 'Try again',
  },
  about: {
    metaTitle: 'About us',
    metaDescription: '{name} is an open marketplace for car rentals, installment purchases and leasing.',
    title: 'About us',
    blocks: [
      { p: '**{name}** is a listings marketplace for renting a car, buying it in installments or leasing it. Our goal is to solve the biggest problem in this market: **unclear terms**.' },
      { h2: 'The problem' },
      { p: 'Typical ads only say “30M down, 6M per month”. Buyers find out the total cost, the markup and the payment schedule only after visiting the seller’s office.' },
      { h2: 'The solution' },
      {
        ul: [
          'The seller enters the price, down payment, term and rate — the system calculates **the monthly payment, the total amount and a month-by-month schedule**.',
          'Three calculation methods are supported: annuity (interest on the remaining balance), flat markup and a fixed monthly payment. In the last case the system **back-calculates the effective annual rate**, so buyers see the real cost.',
          'Buyers can compare up to 4 cars side by side: monthly payment, total cost, markup share, insurance and ownership terms in one table.',
          'If a saved listing gets cheaper or a new listing matches a saved search, you get a notification.',
        ],
      },
      { h2: 'What we are not' },
      { p: '{name} is not a financial institution: we do not issue loans or sign contracts. We are a listings platform. All payment terms are entered by sellers, who are responsible for their information.' },
      { h2: 'Get started' },
      { p: '[Browse listings](/elonlar), [use the calculator](/kalkulyator) or [sign up as a dealer](/royxatdan-otish?turi=yuridik).' },
    ],
  },
  guide: {
    metaTitle: 'Guide & FAQ',
    metaDescription: 'How to post a listing and enter payment terms correctly.',
    title: 'Guide for sellers',
    blocks: [
      { p: 'Posting listings is free. The steps below build buyer trust and bring more requests.' },
      { h2: '1. Sign up' },
      { p: 'Sign up [as a dealer](/royxatdan-otish?turi=yuridik) or as an individual and fill in your company details. After your tax ID and documents are checked, your profile gets a **“Verified”** badge — such listings rank higher in search.' },
      { h2: '2. Enter the car details' },
      { p: 'Make, model, year, mileage and specifications. Be accurate — listings with mismatched details are rejected.' },
      { h2: '3. Upload good photos' },
      {
        ul: [
          'At least 4–6 photos: front, side, rear, interior, dashboard;',
          'Shoot in daylight, in a well-lit place;',
          'The first photo becomes the cover — choose the best one.',
        ],
      },
      { h2: '4. Sale format and payment terms' },
      { p: 'Cash sale, installments, leasing and rent — you can offer several at once. For installments, choose one of three calculation methods:' },
      {
        ul: [
          '**Annuity** — interest accrues on the remaining balance each month. Banks and leasing companies use this method. It gives the lowest markup.',
          '**Flat markup** — interest is added once to the full amount and split evenly across months. Simpler, but the markup is higher.',
          '**I will enter the monthly payment** — you enter the exact amount and the system back-calculates the effective annual rate. Showrooms usually work this way.',
        ],
      },
      { p: 'A schedule is built automatically for every plan, and you see the result instantly next to the form.' },
      { h3: 'Offer several plans' },
      { p: 'Listings with 12 / 24 / 36-month options get more requests than those with a single plan — buyers pick what fits their budget.' },
      { h2: '5. Wait for review' },
      { p: 'Each listing is reviewed (usually within a few hours). If it is rejected, you will see the reason and can fix it and resubmit.' },
      { h2: '6. Respond to requests quickly' },
      { p: 'Update the status of every request in the [Requests](/kabinet/arizalar) section. Faster replies mean more deals.' },
      { h2: 'What gets rejected' },
      {
        ul: [
          'No photos, or photos taken from the internet;',
          'Payment terms missing or not matching reality;',
          'The same car posted several times;',
          'Links to other websites or advertising in the listing text.',
        ],
      },
      { h2: 'Frequently asked questions' },
      { h3: 'Is posting paid?' },
      { p: 'No, a regular listing is free. Promoting a listing (VIP / TOP) is an optional paid service.' },
      { h3: 'Does the platform accept payments?' },
      { p: 'No. {name} is only a listings platform — all payments and contracts are made directly between the buyer and the seller.' },
      { h3: 'What happens if I change the price?' },
      { p: 'If the price drops, buyers who saved the listing get a notification, and the card shows the old price crossed out.' },
    ],
  },
  terms: {
    metaTitle: 'Terms of use',
    metaDescription: 'Rules for using the {name} platform.',
    title: 'Terms of use',
    blocks: [
      { p: 'By using the platform you agree to the following terms. When the terms change, the date on this page is updated.' },
      { h2: '1. Status of the platform' },
      { p: '{name} is a listings service. The platform is not a party to any contract, does not accept payments and does not provide financial services. All agreements are made directly between the buyer and the seller.' },
      { h2: '2. Seller obligations' },
      {
        ul: [
          'Post listings only for real, available cars;',
          'State the price and payment terms fully and accurately — with no hidden fees;',
          'Honour the terms stated in the listing;',
          'Unpublish the listing if the car is sold, rented out or unavailable.',
        ],
      },
      { h2: '3. User obligations' },
      {
        ul: [
          'Provide accurate information when sending a request;',
          'Do not use the platform for spam or fraud.',
        ],
      },
      { h2: '4. Moderation' },
      { p: 'Every new listing is reviewed before publication. Listings that break the rules are rejected; repeated violations may lead to account suspension.' },
      { h2: '5. Paid services' },
      { p: 'VIP and TOP services increase a listing’s visibility but do not guarantee a deal. The service period starts when it is confirmed.' },
      { h2: '6. Liability' },
      { p: 'The platform is not responsible for the accuracy of listing information or for the performance of agreements between the parties. Check all documents yourself before signing a contract.' },
      { h2: '7. Account deletion' },
      { p: 'You may request deletion of your account at any time. Your listings and personal data will then be deleted.' },
    ],
  },
  privacy: {
    metaTitle: 'Privacy policy',
    metaDescription: 'What personal data is collected and how it is used.',
    title: 'Privacy policy',
    blocks: [
      { h2: 'What data we collect' },
      {
        ul: [
          '**When you sign up:** full name, phone number, email (optional).',
          '**From dealers:** company name, tax ID, address, contact details.',
          '**While you use the site:** saved listings and searches, sent requests, notification settings.',
          '**From sellers:** the phone number, Telegram username and (optionally) car location coordinates shown in the listing.',
        ],
      },
      { h2: 'How we use data' },
      {
        ul: [
          'To provide the service: listings, requests, comparison, notifications;',
          'When you send a request, your phone number is shown to the relevant seller;',
          'For security: preventing spam and fraud.',
        ],
      },
      { h2: 'What we do not do' },
      { p: 'We do not sell your personal data to third parties or share it for advertising purposes.' },
      { h2: 'Password security' },
      { p: 'Passwords are stored encrypted with bcrypt — no one, including platform staff, can see your password. When you change your password, all sessions on other devices are ended.' },
    ],
    cookiesTitle: 'Cookies and analytics',
    cookiesOn:
      'In addition to essential cookies (session, language and theme choice), we use {trackers} to measure site traffic and advertising performance. They anonymously count page views and actions such as “Call” and “Send request”; your name, phone number and password are never shared with them. You can disable these cookies in your browser settings or with an ad blocker.',
    cookiesOff:
      'Only essential cookies are used: session (to keep you signed in), language and theme choice. No tracking cookies are used.',
    rightsTitle: 'Your rights',
    rights: 'You can ask to view, correct or delete your data — write to [{email}](mailto:{email}).',
  },
  contact: {
    metaTitle: 'Contact',
    metaDescription: 'Contact us with questions, suggestions or complaints.',
    title: 'Contact',
    intro: 'If you have a question, a suggestion or a complaint about a listing, write to us. We reply within 24 hours on business days.',
    phone: 'Phone',
    email: 'Email',
    telegram: 'Telegram',
    address: 'Address',
    addressValue: 'Tashkent',
    hours: 'Working hours',
    fraudTitle: 'Encountered fraud?',
    fraudText:
      'If a seller asks for prepayment without a contract or changes the terms stated in the listing, let us know right away. Send us the listing link and a screenshot of the conversation.',
  },
}

export default pages
