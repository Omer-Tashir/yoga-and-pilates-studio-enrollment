export enum ClassType {
    PILATES = 'פילאטיס',
    YOGA = 'יוגה'
}

export class Class {
    uid!: string;
    date!: any;
    type!: ClassType;
    auditorium!: string;
    participents!: Array<string>;
    waitingList!: Array<string>;
}