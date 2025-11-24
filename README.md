<div align="center">
  <img src="public/beaverlogo.png" alt="Fundsui Logo" width="200"/>

# Fundsui!

</div>

Fundsui is a decentralized creator-subscription platform. fully built using Sui,
Walrus, and Seal, as well as web technologies such as Next.js.

Fundsui allows creators to create their own channels, and set their subscription
price. They can then upload podcast on Walrus and encrypted with Seal. In order
to access those podcasts, users can then subscribe to those channels for a set
period of time, which then gives them access to decrypt and listen to podcast.

## 3% Fee, Forever!

Creators launching their subscriptions on other web 2.0 centralized platforms
are at the mercy of those platforms to not increase their fees. In fact
[just this year Patreon increased their fees for new users from 8% to
10%](https://www.theverge.com/news/687570/patreon-standard-price-plan-increase-10-dollars),
and
[had another change in how their fees worked in 2017](https://fortune.com/2017/12/09/patreon-fee-changes/).

We have created a trust-through-immutability system where **we take a 3% fee
that cannot changed!** It's built directly into the smart contract, and
immutable by the contract providers. Creators who publish on the Fundsui smart
contract can rest well knowing that their earnings will never be subjected to
surprise fee hikes or shifting platform policies.

## Censorship-Resistant

Not only can others host their own frontends for it, we encourage it! We provide
revenue sharing for other frontend host to incentivize them to host their own
frontend. Every new subscription or renewal will provide one percent to the
current frontend host. This provides censorship resistance as there is not a
single frontend that has control over what is allowed on their page, and gives
users trust that even if they are banned from one frontend they can go to
another.

Other platforms have faced payment processor censorship this year.
[Itch.io faced
disruptions to because of payment processor complaints](https://www.rockpapershotgun.com/itchio-are-seeking-out-new-payment-processors-who-are-more-comfortable-with-adult-material),
and
[PayPal stopped
processing Steam transactions in some countries due to content disputes](https://www.ign.com/articles/valve-confirms-paypal-has-stopped-processing-steam-transactions-in-some-countries-as-nsfw-game-row-continues).
By building on cryptocurrency, Fundsui creators are free from this risk no
payment processor can censor their content or dictate what they create and sell.

## Project Structure & Short Documentation

```
contract/                   # Move smart contracts for Sui blockchain
  sources/                  # Channel, podcast, and seal policy contracts

infra/                      # Terraform configuration for AWS deployment

src/          
  app/                      # Next.js app router pages
    [channel]/              # Dynamic channel route
    [channel]/[podcast]     # Dynamic podcast route
    dashboard/              # Subscriber dashboard
    explore/                # Browse channels
    upload/                 # Podcast upload
  
  components/               # shadcn/ui components
  
  server/                   # Backend tRPC API
  
  services/                 # Business logic layer
    backend/                # Data fetching (channels, podcasts, subscriptions)
    walrus-utils.ts         # Walrus storage helpers
```

## Quick Start

**Development:**

```bash
pnpm dev              # Start dev server
pnpm build            # Build application for deployment
pnpm check            # Lint and format code
```

**Docker:**

```bash
just build            # Build Docker image
just deploy-to-ecr    # Deploy to AWS ECR
```

## Where do we go from here?

- Expand from just podcast to other types of media, such as photos, videos and
  downloads.
- Move from Sui to USDC
- Subscription tiers
- Web 2.0 Shim
- Supporting Creator Markets and Commissions.
