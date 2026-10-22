// Single source for the homepage FAQ. src/components/FAQ.astro renders these and
// src/pages/index.astro builds the FAQPage JSON-LD from the same array, so the
// structured data always matches the visible FAQ exactly.
//
// Every answer here is COUNSEL-APPROVED VERBATIM. Do not edit without counsel review.
// 'what-stays-mine': Standing Decision "MARKETING FAQ WORDING" (2026-10-19).
// All others: Standing Decision "MARKETING FAQ BATCH AND HOMEPAGE WORDING, counsel round 3" (2026-10-22).
export interface Faq {
  id: string;
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

export const faqs: Faq[] = [
  {
    id: 'content-first',
    question: 'Do I need videos, a course or a program library first?',
    answer:
      'No. Your AI is set up from one guided conversation about how you program, progress people and talk to clients. If you have documents or programs, you can add them, but you can start without a content library.',
    defaultOpen: true,
  },
  {
    id: 'setup',
    question: 'What does setup involve?',
    answer:
      'Tell us about your practice, add any coaching materials you have if you want to, then have one guided conversation about how you coach. You review and confirm what your AI will work from, and you can edit it later in your settings. A setup guide then takes you through the rest, up to inviting your first client.',
  },
  {
    id: 'import',
    question: 'Can I bring the programs I already run?',
    answer:
      'Yes. Upload spreadsheets, Word (.docx) documents, text-based PDFs or plain text files. Wolvec matches each line to the exercise catalog and turns the program into a template. Every imported line starts unconfirmed until you check it.',
  },
  {
    id: 'ai-disclosure',
    question: 'Do my clients know when they are talking to AI?',
    answer:
      'Yes. Wolvec tells clients how AI is being used in chat. A notice under your name says which applies. When you review replies, it says you review every AI drafted reply before they see it. When your AI may reply on its own, it says replies may come from your AI without you reviewing them first. Both say AI can make mistakes and does not give medical advice. Clients also acknowledge this when they join. With chat set to All off, no AI reply is generated and their messages go to you.',
  },
  {
    id: 'pain-or-injury',
    question: 'What happens if a client mentions pain or an injury?',
    answer:
      "Wolvec's limited safety controls look for certain reports of pain, injury, illness and other physical health concerns. When one is picked up, Wolvec sends a safety email and flags it in your inbox. The client sees a notice telling them to seek prompt medical attention if the issue feels severe, worsening or urgent, and their chat stays on Coach review until you review the health flag. Every new client also completes a health screening that you review before coaching is unlocked. These controls may not identify every concern and are not medical monitoring.",
  },
  {
    id: 'age',
    question: 'Can I coach clients under 18?',
    answer: 'No. Wolvec is available only to coaches and clients age 18 or older.',
  },
  {
    id: 'delete-account',
    question: 'Can I delete my account?',
    answer:
      "Yes. You can request account deletion in Settings. If no client transition is required, your access ends when you confirm and deletion completes after a 7 day waiting period. If you are a Coach with clients, Wolvec first uses a 14 day transition to resolve those coaching relationships. Deleting a Coach account does not delete client accounts, and a client's data is not moved to another Coach without that client's agreement. Wolvec may retain limited records where required for agreements, billing, disputes, security, fraud prevention or other legal obligations. For other requests about your data, email privacy@wolvec.ai.",
  },
  {
    id: 'what-stays-mine',
    question: 'What stays mine, and what am I responsible for?',
    answer:
      'You retain any ownership rights you have in content you create and provide through Wolvec. Your clients are your clients, and you retain full responsibility for the coaching relationship. You determine whether medical clearance is required and remain responsible for the professional judgment to proceed within your scope of practice. Wolvec provides the platform.',
  },
];
