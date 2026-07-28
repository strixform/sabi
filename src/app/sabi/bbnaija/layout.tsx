import { pageMetadata, breadcrumbLd, faqLd } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Buy BBNaija Votes',
  description:
    'Vote for your favourite BBNaija housemate with real Nigerians. Genuine, paced votes from real people on real devices — the honest way to keep your fave in the house. Starts within minutes.',
  ogTitle: 'Buy BBNaija Votes — Keep Your Favourite Housemate In The House',
  path: '/sabi/bbnaija',
  keywords:
    'buy bbnaija votes, bbnaija voting, vote bbnaija housemate, bbnaija votes nigeria, how to vote bbnaija, buy votes for bbnaija, bbnaija poll votes, bbnaija season votes',
});

const FAQ = [
  {
    q: 'How do I buy BBNaija votes?',
    a: 'Paste the voting link, tell us which housemate to vote for, choose how many votes, and pay. Real Nigerians then cast the votes, paced naturally over the voting window.',
  },
  {
    q: 'Are the votes real?',
    a: 'Yes. Every vote is cast by a genuine person on a real device — not bots. That is why they hold up on the official voting platforms.',
  },
  {
    q: 'How fast do votes start?',
    a: 'Most orders begin within minutes and are spread across the voting window so they never look like a sudden bot rush.',
  },
  {
    q: 'Can I vote for any housemate?',
    a: 'Yes — you name the housemate when you order, and every voter backs that person on your link.',
  },
];

export default function BBNaijaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbLd([
              { name: 'Home', path: '/' },
              { name: 'BBNaija Votes', path: '/sabi/bbnaija' },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd(FAQ)) }}
      />
      {children}
    </>
  );
}
