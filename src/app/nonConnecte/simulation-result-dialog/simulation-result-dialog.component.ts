import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import {
  MatDialogModule,
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Simulation } from '../../models/simulation.models';
import { SavePromptDialogComponent } from '../save-prompt-dialog/save-prompt-dialog.component';
import { LoginComponent } from '../../auth/login/login.component';

@Component({
  selector: 'app-simulation-result-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule
  ],
  providers: [DecimalPipe, DatePipe],
  templateUrl: './simulation-result-dialog.component.html',
  styleUrls: ['./simulation-result-dialog.component.css']
})
export class SimulationResultDialogComponent implements OnInit {
  displayedColumns: string[] = [
    'dateEcheance',
    'principal',
    'interet',
    'assurance',
    'echeance',
    'capitalRestant'
  ];

  displayedColumnsDeblocages: string[] = ['numero', 'dateDeblocage', 'montant'];

  dataSource!: MatTableDataSource<any>;
  dataSourceDeblocages!: MatTableDataSource<any>;
  frais: any[] = [];
  assurances: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      simulation: Simulation;
      category: string;
      request: any;
      dureeInitiale: number;
      tauxNominalInitial: number;
    },
    public dialogRef: MatDialogRef<SimulationResultDialogComponent>,
    public dialog: MatDialog,
    public decimalPipe: DecimalPipe,
    public datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    console.log('Result dialog data received:', this.data);

    this.frais = [...(this.data.request.fraisList || [])];
    this.assurances = [...(this.data.request.assuranceList || [])];

    this.dataSource = new MatTableDataSource(this.data.simulation?.tableauAmortissement || []);

    const deblocages = this.data.simulation?.tableauDeblocages ?? [];

    this.dataSourceDeblocages = new MatTableDataSource(
      deblocages.filter(d => d?.montant !== undefined && d?.dateDeblocage)
    );
  }

  get coutTotal(): number {
    const totalEcheances =
      this.data.simulation?.tableauAmortissement?.reduce((acc, curr) => acc + (curr.echeanceTotale || 0), 0) || 0;
    const frais = this.frais?.reduce((acc, curr) => acc + (curr.montant || 0), 0) || 0;
    const assurances = this.assurances?.reduce((acc, curr) => acc + (curr.montant || 0), 0) || 0;
    const montantEmprunte = this.data.request?.montantEmprunte || 0;

    return Math.round(totalEcheances + frais + assurances - montantEmprunte);
  }

  getEcheanceDate(index: number): Date {
    const debut = new Date(this.data.request.datePremiereEcheance);
    let monthsToAdd = 0;
    switch (this.data.request.frequence) {
      case 'MENSUELLE': monthsToAdd = 1; break;
      case 'TRIMESTRIELLE': monthsToAdd = 3; break;
      case 'SEMESTRIELLE': monthsToAdd = 6; break;
      case 'ANNUELLE': monthsToAdd = 12; break;
      default: monthsToAdd = 1;
    }
    const date = new Date(debut);
    date.setMonth(debut.getMonth() + index * monthsToAdd);
    return date;
  }

  promptLogin(): void {
    this.dialogRef.close();

    const promptRef = this.dialog.open(SavePromptDialogComponent, {
      width: '90%',
      maxWidth: '400px',
      disableClose: true
    });

    promptRef.afterClosed().subscribe(result => {
      if (result === 'connect') {
        this.dialog.closeAll();
        this.dialog.open(LoginComponent, {
          width: '500px',
          maxWidth: '90%',
          disableClose: true
        });
      }
    });
  }
}
