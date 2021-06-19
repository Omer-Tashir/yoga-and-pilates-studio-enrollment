export enum MembershipType {
    MONTHLY = 'מנוי חופשי חודשי',
    CARD_OF_5_ENTRANCES = 'כרטיסייה של 5 כניסות',
    CARD_OF_10_ENTRANCES = 'כרטיסייה של 10 כניסות'
}

export class ClubMember {
    uid!: string;
    name!: string;
    email!: string;
    membershipType!: MembershipType;
    memberSince!: any;
    expirationDate!: any;
    entrancesLeft!: number;
}