import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Message } from "../model/message";
import { DatabaseService } from "./database.service";

@Injectable({
    providedIn: 'root',
})
export class MessageService {

    constructor(
        private db: DatabaseService
    ) {}

    sendMessageToClubMember(msg: Message): Observable<string> {
        return this.db.createMessage(msg);
    }

    removeMessage(msg: Message): Observable<string> {
        return this.db.removeMessage(msg);
    }
}