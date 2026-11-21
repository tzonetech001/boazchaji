import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Customer } from '../../../core/models/customer.model';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.css']
})
export class ServiceFormComponent implements OnInit {
  serviceForm: FormGroup;
  searchResults: Customer[] = [];
  showDropdown = false;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  
  deviceTypes: any[] = [];
  agents: any[] = [];
  isAdmin = false;
  isSubmitting = false;

  constructor(private fb: FormBuilder, private api: ApiService, private auth: AuthService, private router: Router) {
    this.serviceForm = this.fb.group({
      customer_id: [null, Validators.required],
      customer_name: ['', Validators.required],
      customer_phone: ['', [Validators.required, Validators.pattern('^(06|07)[0-9]{8}$')]],
      device_type_id: ['', Validators.required],
      device_name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      amount: [300, [Validators.required, Validators.min(0)]],
      status: ['pending'],
      agent_id: [null, Validators.required]
    });
  }

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    this.isAdmin = user?.role === 'admin';
    
    if (!this.isAdmin) {
      this.serviceForm.patchValue({ agent_id: user?.id });
    } else {
      this.api.getAgents().subscribe(res => this.agents = res);
    }

    this.api.getDeviceTypes().subscribe(res => this.deviceTypes = res);

    // Autocomplete customer
    this.serviceForm.get('customer_name')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(),
        switchMap(value => (typeof value === 'string' && value.length > 1) ? this.api.searchCustomers(value) : of([]))
      ).subscribe(results => {
        this.searchResults = results;
        this.showDropdown = results.length > 0;
      });
  }

  selectCustomer(c: Customer) {
    this.serviceForm.patchValue({ customer_id: c.id, customer_name: c.name, customer_phone: c.phone });
    this.showDropdown = false;
  }

  createNewCustomer() {
    const name = this.serviceForm.get('customer_name')?.value;
    const phone = this.serviceForm.get('customer_phone')?.value;
    if (!name || !phone) return alert("Weka jina na namba sahihi kwanza");

    this.api.addCustomer({ name, phone }).subscribe(res => {
      this.serviceForm.patchValue({ customer_id: res.id });
      this.showDropdown = false;
    });
  }

  addDeviceType() {
    const type = prompt("Weka jina la aina mpya ya kifaa:");
    if (type) {
      this.api.addDeviceType(type).subscribe(res => {
        this.deviceTypes.push({ id: res.id, name: type });
        this.serviceForm.patchValue({ device_type_id: res.id });
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.serviceForm.invalid) return;
    this.isSubmitting = true;

    const formData = new FormData();
    Object.keys(this.serviceForm.value).forEach(key => {
      if (this.serviceForm.value[key] !== null) formData.append(key, this.serviceForm.value[key]);
    });
    if (this.selectedFile) formData.append('image', this.selectedFile);

    this.api.addService(formData).subscribe({
      next: () => { this.router.navigate(['/services']); },
      error: (err) => { alert('Hitilafu: ' + err.error.message); this.isSubmitting = false; }
    });
  }
}