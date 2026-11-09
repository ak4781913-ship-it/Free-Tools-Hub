export interface SamplePage {
  id: string;
  name: string;
  url: string;
  description: string;
  ttfbMs: number;
  html: string;
}

export const SAMPLE_PAGES: SamplePage[] = [
  {
    id: 'well-optimized',
    name: 'Top Ranked SaaS (Grade A+)',
    url: 'https://pulseanalytics.io/pricing',
    description: 'Perfect title (48 chars), optimal description (145 chars), single H1, sequential headings, and full OpenGraph markup.',
    ttfbMs: 110,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pulse Analytics Pricing – Transparent Plans for Growing Teams</title>
  <meta name="description" content="Explore Pulse Analytics transparent pricing plans with unlimited seats, real-time telemetry, and 99.9% SLA guarantees. Start your free 14-day trial today." />
  <link rel="canonical" href="https://pulseanalytics.io/pricing" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Pulse Analytics Pricing – Transparent Plans for Growing Teams" />
  <meta property="og:description" content="Explore Pulse Analytics transparent pricing plans with unlimited seats, real-time telemetry, and 99.9% SLA guarantees. Start your free 14-day trial today." />
  <meta property="og:image" content="https://pulseanalytics.io/og-pricing.jpg" />
  <meta property="og:url" content="https://pulseanalytics.io/pricing" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Pulse Analytics Pricing – Transparent Plans" />
  <meta name="twitter:description" content="Explore Pulse Analytics transparent pricing plans with unlimited seats." />
  <meta name="twitter:image" content="https://pulseanalytics.io/og-pricing.jpg" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Pulse Analytics SaaS",
    "description": "Enterprise cloud performance telemetry"
  }
  </script>
</head>
<body>
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/features">Features</a>
      <a href="/pricing">Pricing</a>
      <a href="https://github.com/pulse" rel="noopener">GitHub</a>
    </nav>
  </header>
  <main>
    <h1>Simple, Predictable Cloud Analytics Pricing</h1>
    <p>Choose the tier that matches your infrastructure bandwidth.</p>
    <h2>Starter Tier</h2>
    <p>Ideal for early stage startups.</p>
    <h2>Professional Tier</h2>
    <p>Designed for mid-market scale.</p>
    <h3>Included Features</h3>
    <ul>
      <li>Automated anomaly alerts</li>
      <li>Custom SQL metrics</li>
    </ul>
    <h2>Enterprise Tier</h2>
    <p>Dedicated VPC and 24/7 dedicated engineering support.</p>
    <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71" alt="Analytics dashboard analytics preview" width="800" height="500" loading="lazy" />
  </main>
  <footer>
    <p>© 2026 Pulse Analytics. All rights reserved.</p>
  </footer>
</body>
</html>`,
  },
  {
    id: 'heading-issues',
    name: 'E-Commerce Store (Hierarchy Issues & Missing H1)',
    url: 'https://urbangear-boutique.com/summer-sale',
    description: 'Missing <h1> tag entirely, skips from H2 directly to H4, images without alt text, and short meta description.',
    ttfbMs: 340,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Summer Sale 2026</title>
  <meta name="description" content="Big summer deals." />
  <link rel="canonical" href="https://urbangear-boutique.com/summer-sale" />
</head>
<body>
  <nav>
    <a href="/">Store</a>
    <a href="/sale">Sale</a>
    <a href="/cart">Cart</a>
  </nav>
  <main>
    <!-- Notice: NO H1 tag exists here! -->
    <h2>Trending Apparel Discounts</h2>
    <p>Up to 50% off select summer jackets and sneakers.</p>
    <!-- Notice: Skips H3 directly to H4! -->
    <h4>Featured Footwear</h4>
    <p>Limited sizes available.</p>
    <img src="/assets/shoes.jpg" width="400" height="300" />
    <img src="/assets/shirt.jpg" />
    <h2>Customer Reviews</h2>
    <p>Rated 4.8 out of 5 stars by over 10,000 customers worldwide.</p>
  </main>
</body>
</html>`,
  },
  {
    id: 'missing-meta-tags',
    name: 'Legacy News Site (Multiple Meta Errors & HTTP)',
    url: 'http://daily-tech-chronicle.net/article-1029',
    description: 'Insecure HTTP protocol, no meta description, multiple H1 headings, slow server response, missing viewport tag.',
    ttfbMs: 950,
    html: `<!DOCTYPE html>
<html>
<head>
  <!-- Notice: Insecure HTTP and Missing Viewport, Meta Description, OpenGraph, Favicon -->
  <title>Daily Tech Chronicle - Breaking tech updates and deep engineering reports from around the world today</title>
</head>
<body>
  <!-- Notice: Multiple H1 tags -->
  <h1>Daily Tech Chronicle</h1>
  <h1>Quantum Computing Breakthrough Reported by Zurich Researchers</h1>
  <p>New coherence times exceed previous benchmarks by 400%.</p>
  <h3>Key Scientific Findings</h3>
  <p>Detailed analysis of superconducting qubits.</p>
  <img src="/diagram.png">
  <img src="/graph.png">
  <a href="/archive">Past issues</a>
  <a href="/authors"></a>
</body>
</html>`,
  },
  {
    id: 'broken-links-audit',
    name: 'Marketing Agency (3 Broken Internal Links)',
    url: 'https://vanguard-growth.com/insights/seo-trends',
    description: 'Contains broken 404 dead links, missing redirect destinations, and server 500 error links to test crawler diagnostics.',
    ttfbMs: 180,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>2026 Enterprise Search Engine Optimization Growth Playbook</title>
  <meta name="description" content="Discover actionable technical SEO strategies, link architecture audits, and Core Web Vitals optimization techniques for competitive modern brands." />
  <link rel="canonical" href="https://vanguard-growth.com/insights/seo-trends" />
  <meta name="robots" content="index, follow" />
  <meta property="og:title" content="2026 Enterprise SEO Playbook" />
  <meta property="og:description" content="Discover actionable technical SEO strategies." />
  <meta property="og:url" content="https://vanguard-growth.com/insights/seo-trends" />
</head>
<body>
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/services">SEO Solutions</a>
      <a href="/case-studies">Case Studies</a>
      <a href="/team/former-partner">Leadership Team</a>
      <a href="/contact">Contact Us</a>
    </nav>
  </header>
  <main>
    <h1>2026 Enterprise Search Engine Optimization Growth Playbook</h1>
    <p>Comprehensive guide to auditing on-page health and internal site architecture.</p>
    <h2>Internal Linking & Dead End Elimination</h2>
    <p>Ensuring your link graph contains zero 404 dead ends is crucial for crawler efficiency.</p>
    <p>Check out our <a href="/blog/discontinued-strategy-2021">2021 Organic Strategy Guide</a> for legacy context.</p>
    <p>Download our <a href="/downloads/q3-whitepaper-old.pdf">Full Q3 PDF Industry Report</a> here.</p>
    <p>Preview internal staging environments at <a href="/internal-staging">Staging QA Sandbox</a>.</p>
    <h2>Action Plan for Marketers</h2>
    <p>Regular crawls guarantee user retention and crawl budget preservation.</p>
  </main>
  <footer>
    <a href="/privacy">Privacy Policy</a>
    <a href="/terms">Terms of Service</a>
  </footer>
</body>
</html>`,
  },
  {
    id: 'missing-critical-elements',
    name: 'Unindexed Landing Page (Missing Description, H1 & Canonical)',
    url: 'https://swiftlaunch-start.io/beta-features',
    description: 'Specifically missing critical SEO requirements: No <meta name="description">, no <h1> heading, no <link rel="canonical"> tag, and no viewport tag.',
    ttfbMs: 290,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Beta Features - SwiftLaunch Early Access Program</title>
  <!-- Notice: Missing <meta name="description">, <link rel="canonical">, <meta name="viewport">, OpenGraph -->
</head>
<body>
  <!-- Notice: Missing <h1> tag completely -->
  <div>
    <h2>Early Access Sneak Peek</h2>
    <p>Sign up now to try our next-generation automation tools before anyone else.</p>
    <h3>Feature Highlights</h3>
    <ul>
      <li>Automated data pipelines</li>
      <li>One-click cloud deployments</li>
    </ul>
    <img src="/assets/preview.png" />
    <button>Join Waitlist</button>
  </div>
</body>
</html>`,
  },
];
