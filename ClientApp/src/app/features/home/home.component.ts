import { Component, ElementRef, Injectable, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

import { LocalStorageServiceService } from '../../core/services/local-storage-service.service';
import { ApiRequest } from '../../core/api/api-therapeutick-studio';
import { AppConstants } from '../../shared/app-constan';
import { ProcedureModel } from 'src/app/shared/Models/ProcedureModel';

import { Observable, OperatorFunction } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { TypeaheadConfig } from 'ngx-bootstrap/typeahead';
import { BsDropdownConfig, BsDropdownDirective } from 'ngx-bootstrap/dropdown';
import { SchedulerModel } from 'src/app/shared/Models/SchedulerModel';
import { TherapistModel } from 'src/app/shared/Models/TherapistModel';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [
    ApiRequest,
    AppConstants,
    TypeaheadConfig,
    BsDropdownConfig,
    BsDropdownDirective,
  ]
})

export class HomeComponent {
  form: FormGroup;

  user: any;
  isAuthenticated: boolean;

  paymentMethodAccess: boolean = false;

  show: boolean = true;
  showDialogDropdown: boolean = true;

  currentDate: any;
  searchDate = new Date;
  workHours: any[];
  reservedHour: any;

  therapist: ITherapistModel;
  therapists: ITherapistModel[];
  therapistFullName: string;

  procedures: IProcedureModel[];
  procedure: IProcedureModel;

  clients: IClientModel[];
  client: IClientModel;
  clientToView: string;
  clientFullName: string;

  schedulers: ISchedulerModel[];
  scheduler: ISchedulerModel;

  constructor(
    private storage: LocalStorageServiceService,
    private apiRequest: ApiRequest,
    private constants: AppConstants,
    private fb: FormBuilder,
  ) { }

  ngOnInit() {

    this.form = this.fb.group({
      clientFullName: [null],
      currProcedure: [null],
      therapistFullName: [null],
      reservedHour: [null],
    });

    this.isAuthenticated = false;
    this.currentDate = this.createCurrentDate(new Date()).toLocaleDateString();
    //console.log(this.currentDate);

    this.user = JSON.parse(this.storage.getUser());
    this.isAuthenticated = this.user != null;

    this.apiRequest.getTherapist()
      .subscribe(data => {
        this.therapists = data;
        //console.log(this.therapists);

      });

    this.createWorkHours();

    this.apiRequest.getProcedures()
      .subscribe(data => {
        this.procedures = data;
        this.procedures.unshift({ name: 'Select Procedure:' } as ProcedureModel);
      });

    this.apiRequest.getClients()
      .subscribe(data => {
        this.clients = data;
      });

    this.getScheduler(new Date(), 0);
  }

  private searchClients(): string[] {
    let clientsExtend: string[] = [];
    // let query = event.query;
    for (let i = 0; i < this.clients.length; i++) {
      let client = this.clients[i];

      //TODO find better way to remove clinet middleName null value
      if (client.middleName != null) {
        client.fullName = client.firstName + ' ' + client.middleName + ' ' + client.lastName;
      } else {
        client.fullName = client.firstName + ' ' + client.lastName;
      }
      clientsExtend.push(client.fullName);
    }

    // this.filteredClient = filtered;
    return clientsExtend;
  }

  private cancel(): void {
    this.form.reset();
    this.show = !this.show;
  }

  private save(therapistFullName, reservedHour): void {
    this.show = !this.show;
    let currentScheduler = new SchedulerModel;
    currentScheduler.timeStamp = reservedHour;
    currentScheduler.procedureId = this.procedures.find(x => x.name == this.form.value.currProcedure).id;
    currentScheduler.clientId = this.clients.find(x => x.fullName == this.form.value.clientFullName).id;
    currentScheduler.therapistId = this.getTherapistId(therapistFullName);

    currentScheduler.paymentType = 0;
    //console.log(currentScheduler);

    this.apiRequest.createScheduler(currentScheduler)
      .subscribe(data => {
        //console.log(data);

        this.getScheduler(new Date(), 0);
        this.createWorkHours();
      });

    this.form.reset();
  }

  public isDataAvaible(column, rowData, index): boolean {
    let dataToView = false;

    if ((this.schedulers
      ? this.schedulers.length > 0
      : false) &&
      (this.clients
        ? this.clients.length > 0
        : false) &&
      (this.procedures
        ? this.procedures.length > 0
        : false)
    ) {

      this.schedulers.forEach(scheduler => {

        if (rowData.currentDate == scheduler.timeStamp &&
          column.id == scheduler.therapistId) {
          let clientIndex = this.clients.findIndex(c => c.id == scheduler.clientId);
          let procedureIndex = this.procedures.findIndex(x => x.id == scheduler.procedureId);

          this.clientToView = `${this.clients[clientIndex].firstName} ${this.clients[clientIndex].lastName} - ${this.procedures[procedureIndex].name}`;
          dataToView = true;;
        }
      });

    }
    return dataToView;
  }

  private getTherapistId(therapistFullName): number {
    let addedTherapist = therapistFullName.split(' ');
    let currentTherapist = new TherapistModel as ITherapistModel;
    currentTherapist.firstName = addedTherapist[0];
    currentTherapist.lastName
    let therapistId = this.therapists.find(x =>
    ((x.firstName == addedTherapist[0]) &&
      (x.lastName == addedTherapist[addedTherapist.length - 1]) &&
      (addedTherapist.length > 2 ? x.middleName == addedTherapist[1] : true))).id;

    return therapistId;
  }

  private selectTherapist(therapist, workHour, event): void {
    // console.log(therapist);
    // console.log(workHour);
    // console.log(event.target.innerText);

    this.clientFullName = '';
    this.procedure = null;
    this.paymentMethodAccess = false;
    const dtData = event.target.innerText.split(' - ');

    this.show = !this.show;
    this.therapistFullName = therapist.firstName + ' ' + therapist.lastName;
    this.reservedHour = workHour.currentDate;
    this.showDialogDropdown = !this.showDialogDropdown;

    if (dtData.length == 2) {
      this.paymentMethodAccess = true;
      this.procedure = this.getProcedureName(dtData[1]);
      this.clientFullName = dtData[0];
    }

  }

  private changeProcedure(): void {
    console.log(this.getProcedureName(this.form.value.currProcedure));
  }

  private getProcedureName(name: string): IProcedureModel {
    return this.procedures.find(x => x.name == name);;
  }

  private getScheduler(date, hour): void {
    this.apiRequest.getSchedulers(date.toUTCString(), hour)
      .subscribe(data => {
        console.log(data);
        this.schedulers = data;
      });
  }

  private createCurrentDate(date): Date {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  private createWorkHours(current: Date = this.searchDate): void {
    this.workHours = [];
    for (let i = this.constants.workHourFirstHour; i < this.constants.workHourLastHour; i++) {
      this.workHours.push({
        index: i,
        startMinute: 0,
        endtMinute: 59,
        currentDate: this.createTableDate(current, i),
        text: []
      });
    }
  }

  private createTableDate(current = new Date, index) {
    // console.log(current);
    return new Date(current.getUTCFullYear(),
      current.getUTCMonth(),
      current.getUTCDate(),
      (index), 0, 0.000).toUTCString();
  }
}
