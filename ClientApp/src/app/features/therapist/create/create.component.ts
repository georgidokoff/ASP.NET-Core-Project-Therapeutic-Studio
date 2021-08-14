import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { Infrastructure } from '../../../shared/infrastructure';
import { ApiRequest } from '../../../core/api/api-therapeutick-studio';
import { TherapistModel } from '../../../shared/Models/TherapistModel';
import { TherapistsService } from 'src/app/core/services/therapists.service';
import { MessagesService } from 'src/app/core/services/messages.service';
import { AlertConfig } from 'ngx-bootstrap/alert';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css'],
  providers: [Infrastructure, TherapistModel, ApiRequest, TherapistsService, AlertConfig]
})

export class CreateComponent implements OnInit {
  form: FormGroup;
  positions: any;
  roles: any;

  isLoading: boolean = false;
  alerts: IAlertModel[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private infrastructure: Infrastructure,
    private therapistsService: TherapistsService,
    private messages: MessagesService,
  ) { }

  ngOnInit() {
    this.positions = this.infrastructure.positions;

    this.roles = this.infrastructure.roles;

    this.form = this.fb.group({
      firstName: [null],
      middleName: [null],
      lastName: [null],
      positionType: [null],
      roleType: [null],
    });

    setTimeout(() => {
      this.isLoading = true;
    }, 300);
  }

  onSubmit() {
    this.isLoading = false;

    let currTherapist = new TherapistModel;
    currTherapist.firstName = this.form.value.firstName;
    currTherapist.middleName = this.form.value.middleName;
    currTherapist.lastName = this.form.value.lastName;
    currTherapist.positionType = +this.form.value.positionType;
    currTherapist.roleType = +this.form.value.roleType;

    this.therapistsService.createTherapist(currTherapist)
      .subscribe({
        next: () => {
          this.isLoading = true;
          this.message('create', currTherapist);
          setTimeout(() => {

            this.router.navigate(['/']);
          }, 2000);
        },
        error: (err) => {
          console.error(err);
        }
      });   

    this.form.reset();
  }

  private message(type: string, therapist: ITherapistModel): void {
    this.alerts.push(this.messages
      .get(type, `${therapist.firstName} ${therapist.lastName}`));
  }
}
