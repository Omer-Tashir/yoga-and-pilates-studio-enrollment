export enum ClassType {
    PILATES = 'פילאטיס',
    YOGA = 'יוגה'
}

export class Class {
    uid!: string;
    date!: any;
    hour!: number;
    type!: ClassType;
    auditorium!: any;
    participents!: any;
    waitingList!: Array<string>;
}