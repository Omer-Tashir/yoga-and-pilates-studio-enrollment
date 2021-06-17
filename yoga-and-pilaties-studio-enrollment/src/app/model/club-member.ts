export enum MembershipType {
    MONTHLY,
    CARD_OF_5_ENTRANCES,
    CARD_OF_10_ENTRANCES
}

export class ClubMember {
    uid!: string;
    name!: string;
    email!: string;
    membershipType!: MembershipType;
    memberSince!: any;
}