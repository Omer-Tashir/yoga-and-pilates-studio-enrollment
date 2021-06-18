import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";
import { DatabaseService } from "./core/database.service";

@Injectable({
    providedIn: 'root'
})
export class DbResolverService implements Resolve<boolean> {

    constructor(private db: DatabaseService) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.db.init();
    }
}