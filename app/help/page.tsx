'use client';

import { useState } from 'react';
import Link from 'next/link';

// 1. FAQ Data tailored for PDF/Digital Download users
const faqCategories = [
  {
    category: "📥 Downloads & Access",
    questions: [
      {
        q: "How do I download my PDF after purchasing?",
        a: "Once your payment is confirmed, you will be immediately redirected to a confirmation page with your download link. We also send an email with the subject line 'Your Digital Order Details' containing backup download links that never expire."
      },
      {
        q: "What should I do if my download link isn't working?",
        a: "First, try clearing your browser cache or opening the link in an Incognito/Private window. If you are trying to download on an iPhone or iPad, check your 'Files' app inside the 'Downloads' folder. If the issue persists, contact our support team and we will email you the PDF file directly!"
      },
      {
        q: "How many times can I download the PDF?",
        a: "You get unlimited downloads for personal use! You can download the file to your phone, tablet, and laptop so you always have access to your reading material."
      }
    ]
  },
  {
    category: "📱 Devices & Reading Apps",
    questions: [
      {
        q: "Can I read these PDFs on my iPad or Android tablet?",
        a: "Yes! For the best reading and annotation experience on iPad, we recommend importing your PDF into Apple Books, GoodNotes, or Notability. For Android, Samsung Notes, Xodo, or Adobe Acrobat Reader work beautifully."
      },
      {
        q: "How do I send this PDF to my Kindle?",
        a: "You can easily send PDFs to your Kindle device using Amazon's 'Send to Kindle' service. Simply email the PDF file to your unique Kindle email address (found in your Amazon device settings), or upload it directly through the Amazon 'Send to Kindle' web portal."
      },
      {
        q: "Do your PDFs support interactive clickable tabs and hyperlinks?",
        a: "Yes! Our digital planners and guided workbooks come with embedded hyperlinks. To use them in annotation apps like GoodNotes, make sure you switch from 'Write/Edit Mode' to 'Read/View Mode' so the links become clickable."
      }
    ]
  },
  {
    category: "🖨️ Printing & Customization",
    questions: [
      {
        q: "Can I print these PDFs at home or at a print shop?",
        a: "Absolutely. All our PDFs are formatted in high-resolution (300 DPI) for crisp printing. When printing at home, make sure your printer settings are set to 'Scale to Fit' or 'Actual Size' depending on your paper format (A4 or US Letter)."
      },
      {
        q: "Am I allowed to share this PDF with my friends or students?",
        a: "Our standard purchase license is for individual personal use only. Sharing, reselling, or distributing the PDF files online is copyrighted under intellectual property laws. If you need a classroom or group license, please reach out to our team for discounted bulk rates!"
      }
    ]
  }
];

// 2. Individual Accordion Item Component
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden transition-colors duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left font-medium text-gray-900 bg-white hover:bg-gray-50 flex justify-between items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-expanded={isOpen}
      >
        <span className="text-base sm:text-lg font-general font-medium">{question}</span>
        
        {/* Chevron Icon that rotates when open */}
        <span className={`transform transition-transform duration-200 flex-shrink-0 text-gray-500 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Expandable Answer Section */}
      {isOpen && (
        <div className="px-6 pb-5 pt-2 bg-gray-50/50 border-t border-gray-100 text-gray-600 font-general text-sm sm:text-base leading-relaxed animate-fadeIn">
          {answer}
        </div>
      )}
    </div>
  );
};

// 3. Main Help Page Layout
export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gray-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Hero / Header Section */}
        <div className="text-center mb-12">
          <span className="text-xs font-cabinet font-semibold tracking-wider text-blue-600 uppercase bg-blue-100/60 px-3 py-1 rounded-full">
            Support Center
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold font-cabinet text-gray-900 tracking-tight">
            How Can We Help Your Reading Experience?
          </h1>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            Everything you need to know about downloading, reading on your favorite devices, annotating digital planners, and printing your PDFs.
          </p>
        </div>

        {/* FAQ Categories & Accordions */}
        <div className="space-y-10">
          {faqCategories.map((group, groupIdx) => (
            <section key={groupIdx} className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200/80 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 font-cabinet mb-6 pb-2 border-b border-gray-100">
                {group.category}
              </h2>
              
              <div className="space-y-3">
                {group.questions.map((faq, faqIdx) => (
                  <FAQItem key={faqIdx} question={faq.q} answer={faq.a} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom Support Callout */}
        <div className="mt-16 bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl p-8 sm:p-10 text-center text-white shadow-lg">
          <h3 className="text-2xl font-bold font-cabinet mb-2">Still have questions?</h3>
          <p className="text-blue-100 text-sm sm:text-base max-w-md mx-auto mb-6">
            Can't find what you're looking for? Our digital publishing support team is ready to jump in and help you out.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-blue-900 bg-white hover:bg-blue-50 transition-colors shadow-sm font-general"
          >
            Contact Support
          </Link>
        </div>

      </div>
    </main>
  );
}