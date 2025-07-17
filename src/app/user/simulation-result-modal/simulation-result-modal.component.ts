import { Component, Inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Simulation, SimulationRequestGlobal } from '../../models/simulation.models';
import { SavePromptDialogComponent } from '../save-prompt-dialog/save-prompt-dialog.component';
import { SimulationService } from '../../services/simulation/simulation.service';

@Component({
  selector: 'app-simulation-result-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  providers: [DecimalPipe, DatePipe],
  templateUrl: './simulation-result-modal.component.html',
  styleUrls: ['./simulation-result-modal.component.css']
})
export class SimulationResultModalComponent {
  displayedColumns: string[] = [
    'dateEcheance',
    'principal',
    'interet',
    'assurance',
    'echeance',
    'capitalRestant'
  ];

  displayedColumnsDeblocages: string[] = ['numero', 'dateDeblocage', 'montant'];
  dataSource: MatTableDataSource<any>;
  dataSourceDeblocages: MatTableDataSource<any>;
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
    public dialogRef: MatDialogRef<SimulationResultModalComponent>,
    public dialog: MatDialog,
    public decimalPipe: DecimalPipe,
    public datePipe: DatePipe,
    private simService: SimulationService,
    private snackBar: MatSnackBar
  ) {
    this.frais = [...(data.request?.fraisList || [])];
    this.assurances = [...(data.request?.assuranceList || [])];
    this.dataSource = new MatTableDataSource(data.simulation?.tableauAmortissement || []);
    this.dataSourceDeblocages = new MatTableDataSource(data.simulation?.tableauDeblocages || []);
  }

  getEcheanceDate(index: number): Date | null {
    if (!this.data.request?.datePremiereEcheance) {
      return null;
    }
    const debut = new Date(this.data.request.datePremiereEcheance);
    if (isNaN(debut.getTime())) {
      return null;
    }
    let monthsToAdd = 1;
    switch (this.data.request.frequence?.toUpperCase()) {
      case 'MENSUELLE':
        monthsToAdd = 1;
        break;
      case 'TRIMESTRIALITE':
        monthsToAdd = 3;
        break;
      case 'SEMESTRIELLE':
        monthsToAdd = 6;
        break;
      case 'ANNUELLE':
        monthsToAdd = 12;
        break;
      default:
        console.warn(`Unknown frequency: ${this.data.request.frequence}`);
    }
    const date = new Date(debut);
    date.setMonth(debut.getMonth() + index * monthsToAdd);
    return isNaN(date.getTime()) ? null : date;
  }

  calculerTotalEcheance(): number {
    const montantBase = this.data.simulation?.echeance || 0;
    const totalAssurances = this.assurances?.reduce((acc, a) => acc + (a?.montant || 0), 0) || 0;
    return montantBase + totalAssurances;
  }

  exporter(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 15;

    // Couleurs comme tuples [r, g, b]
    const blueHeader: [number, number, number] = [10, 96, 163]; // bleu foncé
    const blueLightRow: [number, number, number] = [220, 235, 255]; // bleu clair

    // Titre principal centré
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    const title = 'Résultats de la Simulation de Crédit';
    const titleWidth = doc.getTextWidth(title);
    doc.setTextColor(blueHeader[0], blueHeader[1], blueHeader[2]);
    doc.text(title, (pageWidth - titleWidth) / 2, y);
    y += 15;

    // Section Détails
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Catégorie: ${this.data.category || 'N/A'}`, margin, y);
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(blueHeader[0], blueHeader[1], blueHeader[2]);
    doc.text('Détails de la demande', margin, y);
    y += 9;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Montant Emprunté: ${this.decimalPipe.transform(this.data.request?.montantEmprunte || 0, '1.0-2')} FCFA`, margin, y);
    y += 6;
    doc.text(`Taux Nominal: ${this.decimalPipe.transform(this.data.request?.tauxInteretNominal || 0, '1.2-2')}%`, margin, y);
    y += 6;
    doc.text(`Durée: ${this.data.dureeInitiale || 'N/A'} ${this.data.request?.frequence?.toLowerCase() || 'N/A'}`, margin, y);
    y += 6;
    doc.text(`Type d'emprunteur: ${this.data.request?.typeEprunteur || 'N/A'}`, margin, y);
    y += 6;
    doc.text(`Date première échéance: ${this.datePipe.transform(this.data.request?.datePremiereEcheance, 'dd/MM/yyyy') || 'N/A'}`, margin, y);
    y += 12;

    // Frais Obligatoires
    doc.setFontSize(12);
    doc.setTextColor(blueHeader[0], blueHeader[1], blueHeader[2]);
    doc.text('Frais Obligatoires', margin, y);
    y += 9;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    if (this.frais?.length) {
      this.frais.forEach((f) => {
        doc.text(`${f.nom || 'N/A'}: ${this.decimalPipe.transform(f.montant || 0, '1.0-2')} FCFA`, margin, y);
        y += 6;
      });
    } else {
      doc.text('Aucun frais', margin, y);
      y += 6;
    }

    // Assurances Obligatoires
    y += 6;
    doc.setFontSize(12);
    doc.setTextColor(blueHeader[0], blueHeader[1], blueHeader[2]);
    doc.text('Assurances Obligatoires', margin, y);
    y += 9;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    if (this.assurances?.length) {
      this.assurances.forEach((a) => {
        doc.text(`${a.nom || 'N/A'}: ${this.decimalPipe.transform(a.montant || 0, '1.0-2')} FCFA`, margin, y);
        y += 6;
      });
    } else {
      doc.text('Aucune assurance', margin, y);
      y += 6;
    }

    // Tableau Déblocages
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(blueHeader[0], blueHeader[1], blueHeader[2]);
    doc.text('Tableau des Déblocages', margin, y);
    y += 9;

    if (this.data.simulation?.tableauDeblocages?.length) {
      autoTable(doc, {
        startY: y,
        head: [['Numéro', 'Date', 'Montant (FCFA)']],
        body: this.data.simulation.tableauDeblocages.map((d) => [
          d.numero?.toString() || 'N/A',
          this.datePipe.transform(d.dateDeblocage, 'dd/MM/yyyy') || 'N/A',
          this.decimalPipe.transform(d.montant || 0, '1.0-2') || '0'
        ]),
        theme: 'striped',
        headStyles: { fillColor: blueHeader, textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: blueLightRow },
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 }
      });
      y = (doc as any).lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Aucun déblocage', margin, y);
      y += 10;
    }

    // Résultats généraux
    doc.setFontSize(14);
    doc.setTextColor(blueHeader[0], blueHeader[1], blueHeader[2]);
    doc.text('Vos Résultats', margin, y);
    y += 9;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`TEG Annuel: ${this.decimalPipe.transform(this.data.simulation?.tegAnnuel || 0, '1.2-2')}%`, margin, y);
    y += 6;
    doc.text(`Échéance Totale: ${this.decimalPipe.transform(this.calculerTotalEcheance(), '1.0-2')} FCFA`, margin, y);
    y += 6;

    doc.text(`Coût Total du Crédit: ${this.decimalPipe.transform(this.data.simulation?.coutTotal || 0, '1.0-2')} FCFA`, margin, y);
    y += 15;

    // Tableau d'Amortissement
    doc.setFontSize(12);
    doc.setTextColor(blueHeader[0], blueHeader[1], blueHeader[2]);
    doc.text('Tableau d\'Amortissement', margin, y);
    y += 9;

    if (this.data.simulation?.tableauAmortissement?.length) {
      autoTable(doc, {
        startY: y,
        head: [['Date Échéance', 'Capital', 'Intérêt', 'Assurance', 'Échéance', 'Capital Restant']],
        body: this.data.simulation.tableauAmortissement.map((e, i) => [
          this.datePipe.transform(this.getEcheanceDate(i), 'dd/MM/yyyy') || 'N/A',
          this.decimalPipe.transform(e.principal || 0, '1.0-2') || '0',
          this.decimalPipe.transform(e.interet || 0, '1.0-2') || '0',
          this.decimalPipe.transform(e.assurance || 0, '1.0-2') || '0',
          this.decimalPipe.transform(e.echeanceTotale || 0, '1.0-2') || '0',
          this.decimalPipe.transform(e.capitalRestant || 0, '1.0-2') || '0'
        ]),
        theme: 'striped',
        headStyles: { fillColor: blueHeader, textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: blueLightRow },
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 }
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Aucun tableau d\'amortissement', margin, y);
      y += 10;
    }

    doc.save(`simulation_result_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  sauvegarder(): void {
    const requestGlobal: SimulationRequestGlobal = {
      request: this.data.request,
      response: this.data.simulation
    };

    this.simService.saveSimulation(requestGlobal).subscribe({
      next: () => {
        this.snackBar.open('Simulation enregistrée avec succès !', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        setTimeout(() => this.dialogRef.close(), 3000);
      },
      error: (err) => {
        console.error('Erreur sauvegarde:', err);
        const errorMessage = err.message || 'Erreur lors de l\'enregistrement de la simulation. Veuillez vérifier les données saisies.';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  disablePastDates = (d: Date | null): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d ? d >= today : false;
  };
}
