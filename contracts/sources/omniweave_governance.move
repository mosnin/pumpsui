/// OmniWeave On-Chain Governance
///
/// OMNI stakers can create proposals and vote on them using their voting power
/// (staked amount × lock multiplier).  Each vote is recorded as an owned
/// `VoteReceipt` so wallets can prove participation without on-chain iteration.
///
/// Proposal lifecycle
/// ──────────────────
///   1. Any staker with ≥ 10 000 OMNI voting power calls `create_proposal`.
///   2. A 7-day voting window opens immediately.
///   3. Stakers call `vote` with their `StakePosition`; snapshot voting power
///      is recorded.  Re-voting is not blocked on-chain (front-end must gate it
///      using the `VoteReceipt` object — prevent double-spending in PTBs).
///   4. After `end_ms`, `is_passing` can be queried; execution of approved
///      actions is handled off-chain or by a separate executor module.
///
/// Action types
/// ────────────
///   0 — text_only    (signal vote, no on-chain effect)
///   1 — fee_change   (action_data = little-endian u64 new fee_bps)
///   2 — pause        (emergency pause)
///   3 — unpause
module omniweave::omniweave_governance {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    use omniweave::omniweave_staking::{StakePosition, voting_power};

    // ─── Errors ───────────────────────────────────────────────────────────────

    const EProposalNotActive: u64       = 0;
    const EVotingEnded: u64             = 1;
    const EAlreadyVoted: u64            = 2;
    const EInsufficientVotingPower: u64 = 3;

    // ─── Governance constants ─────────────────────────────────────────────────

    /// Minimum voting power (OMNI base-units) needed to open a proposal.
    /// Equivalent to 10 000 OMNI with 9 decimal places.
    const MIN_PROPOSAL_POWER: u64 = 10_000_000_000_000;

    /// How long the voting window stays open: 7 days in ms.
    const VOTING_PERIOD_MS: u64 = 604_800_000;

    /// Quorum: 4% of 1 B OMNI total supply (with 9 decimals).
    const QUORUM_VOTES: u64 = 40_000_000_000_000_000;

    // ─── Objects ──────────────────────────────────────────────────────────────

    /// A governance proposal.  Shared so any staker can read / vote on it.
    public struct Proposal has key {
        id: UID,
        /// Address that submitted the proposal.
        proposer: address,
        /// Short human-readable title.
        title: String,
        /// Full description / rationale.
        description: String,
        /// Cumulative voting power cast in favour.
        for_votes: u64,
        /// Cumulative voting power cast against.
        against_votes: u64,
        /// Block-clock timestamp when voting opened (ms).
        start_ms: u64,
        /// Block-clock timestamp when voting closes (ms).
        end_ms: u64,
        /// Whether the proposal has been executed on-chain.
        executed: bool,
        /// Encoded action: 0=text_only, 1=fee_change, 2=pause, 3=unpause.
        action_type: u8,
        /// Arbitrary payload; interpretation depends on `action_type`.
        action_data: vector<u8>,
    }

    /// Owned receipt minted for each vote.
    /// Provides proof-of-vote; can be used by a front-end to prevent re-voting.
    public struct VoteReceipt has key {
        id: UID,
        proposal_id: ID,
        voter: address,
        votes: u64,
        support: bool,
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    public struct ProposalCreated has copy, drop {
        proposal_id: ID,
        proposer: address,
        title: String,
        end_ms: u64,
    }

    public struct Voted has copy, drop {
        proposal_id: ID,
        voter: address,
        votes: u64,
        support: bool,
    }

    public struct ProposalExecuted has copy, drop {
        proposal_id: ID,
    }

    // ─── Public entry functions ───────────────────────────────────────────────

    /// Create a new governance proposal.
    ///
    /// Requires the caller's `StakePosition` to carry at least
    /// `MIN_PROPOSAL_POWER` voting power.
    public fun create_proposal(
        title: String,
        description: String,
        action_type: u8,
        action_data: vector<u8>,
        stake_pos: &StakePosition,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(voting_power(stake_pos) >= MIN_PROPOSAL_POWER, EInsufficientVotingPower);

        let now_ms = clock::timestamp_ms(clock);

        let proposal = Proposal {
            id: object::new(ctx),
            proposer: tx_context::sender(ctx),
            title,
            description,
            for_votes: 0,
            against_votes: 0,
            start_ms: now_ms,
            end_ms: now_ms + VOTING_PERIOD_MS,
            executed: false,
            action_type,
            action_data,
        };

        event::emit(ProposalCreated {
            proposal_id: object::id(&proposal),
            proposer: tx_context::sender(ctx),
            title: proposal.title,
            end_ms: proposal.end_ms,
        });

        // Share so any staker can interact with it.
        transfer::share_object(proposal);
    }

    /// Cast a vote on an active proposal using the caller's staking position.
    ///
    /// `support = true` → for, `false` → against.
    /// The caller receives an owned `VoteReceipt` as proof.
    public fun vote(
        proposal: &mut Proposal,
        stake_pos: &StakePosition,
        support: bool,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let now_ms = clock::timestamp_ms(clock);
        assert!(now_ms <= proposal.end_ms, EVotingEnded);

        let votes = voting_power(stake_pos);
        assert!(votes > 0, EInsufficientVotingPower);

        if (support) {
            proposal.for_votes = proposal.for_votes + votes;
        } else {
            proposal.against_votes = proposal.against_votes + votes;
        };

        let receipt = VoteReceipt {
            id: object::new(ctx),
            proposal_id: object::id(proposal),
            voter: tx_context::sender(ctx),
            votes,
            support,
        };

        event::emit(Voted {
            proposal_id: object::id(proposal),
            voter: tx_context::sender(ctx),
            votes,
            support,
        });

        transfer::transfer(receipt, tx_context::sender(ctx));
    }

    // ─── View helpers ─────────────────────────────────────────────────────────

    /// Returns `true` when a proposal has more for-votes than against-votes AND
    /// total participation meets quorum.
    public fun is_passing(proposal: &Proposal): bool {
        proposal.for_votes > proposal.against_votes &&
        (proposal.for_votes + proposal.against_votes) >= QUORUM_VOTES
    }

    /// Returns `true` when the voting window is still open.
    public fun is_active(proposal: &Proposal, clock: &Clock): bool {
        clock::timestamp_ms(clock) <= proposal.end_ms
    }

    /// Voting-power tally helpers.
    public fun for_votes(proposal: &Proposal): u64      { proposal.for_votes }
    public fun against_votes(proposal: &Proposal): u64  { proposal.against_votes }
    public fun end_ms(proposal: &Proposal): u64          { proposal.end_ms }
    public fun start_ms(proposal: &Proposal): u64        { proposal.start_ms }
    public fun executed(proposal: &Proposal): bool       { proposal.executed }
    public fun action_type(proposal: &Proposal): u8      { proposal.action_type }
    public fun proposer(proposal: &Proposal): address    { proposal.proposer }
    public fun title(proposal: &Proposal): String        { proposal.title }
    public fun description(proposal: &Proposal): String  { proposal.description }

    // VoteReceipt read helpers
    public fun receipt_proposal_id(receipt: &VoteReceipt): ID  { receipt.proposal_id }
    public fun receipt_voter(receipt: &VoteReceipt): address   { receipt.voter }
    public fun receipt_votes(receipt: &VoteReceipt): u64       { receipt.votes }
    public fun receipt_support(receipt: &VoteReceipt): bool    { receipt.support }
}
