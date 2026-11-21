import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Customer } from '../../../core/models/customer.model';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.css']
})
export class ServiceFormComponent implements OnInit {
  serviceForm: FormGroup;
  
  // Autocomplete variables
  searchResults: Customer[] = [];
  showDropdown = false;
  
  // Image variables
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  
  deviceTypes: any[] = [];
  isSubmitting = false;
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.serviceForm = this.fb.group({
      customer_id: [null, Validators.required],
      customer_name: ['', Validators.required],
      device_type_id: ['', Validators.required],
      device_name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      amount: [300, [Validators.required, Validators.min(0)]],
      agent_id: [null] // Admin anaweza kuchagua, Agent ni automatic
    });
  }

  ngOnInit() {
    // Kama ni agent, chukua ID yake kutoka localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'agent') {
      this.serviceForm.patchValue({ agent_id: user.id });
    }

    // Setup Autocomplete listener
    this.serviceForm.get('customer_name')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(value => {
          if (typeof value === 'string' && value.length > 1) {
            return this.apiService.searchCustomers(value);
          }
          return of([]);
        })
      )
      .subscribe(results => {
        this.searchResults = results;
        this.showDropdown = results.length > 0;
      });
  }

  // Mtu akichagua mteja kwenye dropdown
  selectCustomer(customer: Customer) {
    this.serviceForm.patchValue({
      customer_id: customer.id,
      customer_name: customer.name
    });
    this.showDropdown = false;
  }

  // Mtu akiandika mteja mpya (asiyekuwepo kwenye database)
  createNewCustomer() {
    const name = this.serviceForm.get('customer_name')?.value;
    if (!name) return;

    this.apiService.addCustomer({ name }).subscribe({
      next: (res) => {
        // Baada ya kuunda, tunapata ID yake
        this.serviceForm.patchValue({ customer_id: res.id });
        this.showDropdown = false;
        alert('Mteja mpya ameongezwa kikamilifu!');
      }
    });
  }

  // Image Upload Logic
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Preview picha
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.serviceForm.invalid || this.isSubmitting) return;

    // Hakikisha customer_id ipo (kama hakuchagua kwenye dropdown)
    if (!this.serviceForm.value.customer_id) {
      alert('Tafadhali chagua mteja au bofya "Add New Customer" kabla ya kuhifadhi.');
      return;
    }

    this.isSubmitting = true;

    // Tunatengeneza FormData kwa ajili ya kupitisha picha
    const formData = new FormData();
    const formValues = this.serviceForm.value;
    
    formData.append('agent_id', formValues.agent_id);
    formData.append('customer_id', formValues.customer_id);
    formData.append('device_type_id', formValues.device_type_id);
    formData.append('device_name', formValues.device_name);
    formData.append('quantity', formValues.quantity);
    formData.append('amount', formValues.amount);
    
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.apiService.addService(formData).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = 'Huduma imehifadhiwa kikamilifu!';
        setTimeout(() => {
          this.router.navigate(['/services']); // Rudi kwenye list
        }, 2000);
      },
      error: (err) => {
        this.isSubmitting = false;
        alert('Hitilafu imetokea: ' + (err.error.message || err.message));
      }
    });
  }
}