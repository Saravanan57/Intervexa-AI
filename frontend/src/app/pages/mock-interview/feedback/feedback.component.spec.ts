import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FeedbackComponent } from './feedback.component';
import { InterviewService } from '../../../core/services/interview.service';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('FeedbackComponent', () => {
  let component: FeedbackComponent;
  let fixture: ComponentFixture<FeedbackComponent>;
  let mockInterviewService: jasmine.SpyObj<InterviewService>;
  let originalCreateObjectURL: any;
  let originalRevokeObjectURL: any;

  const mockInterviewData = {
    _id: 'test-interview-888',
    score: 85,
    type: 'Technical',
    domain: 'Frontend Engineering',
    answers: [
      {
        _id: 'ans-1',
        questionText: 'What are Angular Signals?',
        feedbackScore: 88,
        responseText: 'Signals represent reactive values.',
        feedbackContent: 'Accurate and concise explanation.'
      }
    ]
  };

  const mockReport = {
    keyMetrics: {
      technicalScore: 88,
      communicationScore: 82,
      behavioralScore: 85
    },
    detailedSummary: 'Strong candidate demonstrating deep understanding of frontend concepts.'
  };

  beforeEach(async () => {
    mockInterviewService = jasmine.createSpyObj<InterviewService>('InterviewService', [
      'getInterviewDetails',
      'getReportDownloadUrl',
      'downloadReport'
    ]);

    mockInterviewService.getInterviewDetails.and.returnValue(of({
      success: true,
      interview: mockInterviewData,
      feedback: {
        positivePoints: ['Clear explanations', 'Strong fundamentals'],
        improvementTips: ['Elaborate on edge cases']
      },
      report: mockReport
    }));

    await TestBed.configureTestingModule({
      imports: [FeedbackComponent],
      providers: [
        provideRouter([]),
        { provide: InterviewService, useValue: mockInterviewService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'test-interview-888' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load scorecard details', () => {
    expect(component).toBeTruthy();
    expect(component.interviewId).toBe('test-interview-888');
    expect(component.interview()).toEqual(mockInterviewData);
    expect(component.report()).toEqual(mockReport);
    expect(mockInterviewService.getInterviewDetails).toHaveBeenCalledWith('test-interview-888');
  });

  it('should download report as an attachment with proper filename when Download Report is clicked', fakeAsync(() => {
    const mockBlob = new Blob(['<!DOCTYPE html><html><body>Report</body></html>'], { type: 'text/html' });
    mockInterviewService.downloadReport.and.returnValue(of(mockBlob));

    const mockUrl = 'blob:http://localhost:4200/fake-blob-uuid';
    spyOn(window.URL, 'createObjectURL').and.returnValue(mockUrl);
    spyOn(window.URL, 'revokeObjectURL').and.callThrough();

    let clickedAnchor: HTMLAnchorElement | null = null;
    spyOn(document.body, 'appendChild').and.callFake(((node: any) => {
      if (node instanceof HTMLAnchorElement) {
        clickedAnchor = node;
        spyOn(node, 'click').and.callThrough();
      }
      return node;
    }) as any);
    spyOn(document.body, 'removeChild').and.callFake(((node: any) => node) as any);

    expect(component.isDownloading()).toBeFalse();

    component.downloadReport();
    tick();

    expect(mockInterviewService.downloadReport).toHaveBeenCalledWith('test-interview-888');
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(clickedAnchor).not.toBeNull();
    expect(clickedAnchor!.href).toBe(mockUrl);
    expect(clickedAnchor!.download).toBe('interview-report-test-interview-888.html');
    expect(clickedAnchor!.click).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalledWith(clickedAnchor!);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    expect(component.isDownloading()).toBeFalse();
  }));

  it('should disable download button while download is in progress to prevent duplicate clicks', () => {
    component.isDownloading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const downloadBtn = compiled.querySelector('button') as HTMLButtonElement;
    expect(downloadBtn.disabled).toBeTrue();
    expect(downloadBtn.textContent).toContain('Downloading...');
  });

  it('should reset isDownloading and display alert on download failure', fakeAsync(() => {
    mockInterviewService.downloadReport.and.returnValue(throwError(() => new Error('Network error')));
    spyOn(window, 'alert');

    component.downloadReport();
    tick();

    expect(component.isDownloading()).toBeFalse();
    expect(window.alert).toHaveBeenCalledWith('Network error');
  }));
});
