import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActiveInterviewComponent } from './active.component';
import { InterviewService } from '../../../core/services/interview.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

describe('ActiveInterviewComponent', () => {
  let component: ActiveInterviewComponent;
  let fixture: ComponentFixture<ActiveInterviewComponent>;
  let mockInterviewService: any;
  let mockRouter: any;

  const mockSession = {
    _id: 'test-interview-123',
    type: 'Technical',
    domain: 'Full Stack Developer',
    difficulty: 'medium',
    status: 'active',
    currentQuestionIndex: 0,
    predictedScore: 78,
    questions: [
      { text: 'Explain how you would optimize a slow database query.', codeTemplate: '' },
      { text: 'What is the event loop in Node.js?', codeTemplate: '' },
      { text: 'Explain CSS Grid vs Flexbox.', codeTemplate: '' }
    ],
    answers: []
  };

  beforeEach(async () => {
    mockInterviewService = {
      getInterviewDetails: jasmine.createSpy('getInterviewDetails').and.returnValue(of({
        success: true,
        interview: mockSession
      })),
      finishSession: jasmine.createSpy('finishSession').and.returnValue(of({
        success: true,
        message: 'Interview session completed successfully.'
      })),
      submitAnswer: jasmine.createSpy('submitAnswer').and.returnValue(of({
        success: true,
        finished: false,
        currentQuestionIndex: 1,
        predictedScore: 82
      })),
      initSocket: jasmine.createSpy('initSocket'),
      closeSocket: jasmine.createSpy('closeSocket'),
      sendSpeechChunk: jasmine.createSpy('sendSpeechChunk')
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      imports: [ActiveInterviewComponent],
      providers: [
        { provide: InterviewService, useValue: mockInterviewService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'test-interview-123' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActiveInterviewComponent);
    component = fixture.componentInstance;
    component.interviewId = 'test-interview-123';
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('ISSUE 2: should render the question UI and question action controls ONLY ONCE', () => {
    // Set active mock panel state
    component.isCheckingSystem.set(false);
    component.countdownNumber.set(0);
    component.session.set(mockSession);
    component.totalQuestions.set(mockSession.questions.length);
    component.currentIdx.set(0);
    component.currentQuestionText.set(mockSession.questions[0].text);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // Check Question text appears once
    const questionTextElements = Array.from(compiled.querySelectorAll('h3')).filter(
      el => el.textContent?.includes('Explain how you would optimize a slow database query.')
    );
    expect(questionTextElements.length).toBe(1);

    // Check "Repeat Question" button appears once
    const repeatButtons = Array.from(compiled.querySelectorAll('button')).filter(
      el => el.textContent?.includes('Repeat Question')
    );
    expect(repeatButtons.length).toBe(1);

    // Check "Skip Question" button appears once
    const skipButtons = Array.from(compiled.querySelectorAll('button')).filter(
      el => el.textContent?.includes('Skip Question')
    );
    expect(skipButtons.length).toBe(1);

    // Check "Speak Answer" / recording button appears once
    const speakButtons = Array.from(compiled.querySelectorAll('button')).filter(
      el => el.textContent?.includes('Speak Answer')
    );
    expect(speakButtons.length).toBe(1);

    // Check "Your Answer" section appears once
    const answerHeaders = Array.from(compiled.querySelectorAll('h3')).filter(
      el => el.textContent?.includes('Your Answer')
    );
    expect(answerHeaders.length).toBe(1);

    // Question counter and remaining text
    expect(compiled.textContent).toContain('Question 1 of 3');
    expect(compiled.textContent).toContain('2 remaining');
  });

  it('ISSUE 1: should render clearly visible End Interview buttons on the active question screen', () => {
    component.isCheckingSystem.set(false);
    component.countdownNumber.set(0);
    component.session.set(mockSession);
    component.totalQuestions.set(mockSession.questions.length);
    component.currentIdx.set(0);
    component.currentQuestionText.set(mockSession.questions[0].text);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const endInterviewButtons = Array.from(compiled.querySelectorAll('button')).filter(
      el => el.textContent?.includes('End Interview')
    );

    // Present in the header status bar and card action bar
    expect(endInterviewButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('ISSUE 1: should open confirmation dialog when End Interview is clicked', () => {
    component.isCheckingSystem.set(false);
    component.countdownNumber.set(0);
    component.session.set(mockSession);

    fixture.detectChanges();

    expect(component.showEndConfirm()).toBeFalse();

    component.openEndInterviewConfirm();
    fixture.detectChanges();

    expect(component.showEndConfirm()).toBeTrue();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Are you sure you want to end the interview?');
  });

  it('ISSUE 1: should cancel and close confirmation dialog without navigating', () => {
    component.isCheckingSystem.set(false);
    component.countdownNumber.set(0);
    component.session.set(mockSession);
    component.openEndInterviewConfirm();
    fixture.detectChanges();

    expect(component.showEndConfirm()).toBeTrue();

    component.cancelEndConfirm();
    fixture.detectChanges();

    expect(component.showEndConfirm()).toBeFalse();
    expect(mockInterviewService.finishSession).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('ISSUE 1: should call finishSession and navigate to feedback result page on confirmEndInterview', () => {
    component.isCheckingSystem.set(false);
    component.countdownNumber.set(0);
    component.session.set(mockSession);
    component.interviewId = 'test-interview-123';

    component.confirmEndInterview();

    expect(mockInterviewService.finishSession).toHaveBeenCalledWith('test-interview-123');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/mock-interview/feedback', 'test-interview-123']);
  });

  it('should navigate to next question and update remaining counter when submitting answer', () => {
    component.isCheckingSystem.set(false);
    component.countdownNumber.set(0);
    component.session.set(mockSession);
    component.totalQuestions.set(3);
    component.currentIdx.set(0);
    component.textResponse = 'This is my comprehensive response about database indexing and caching.';

    component.submitAnswer();

    expect(mockInterviewService.submitAnswer).toHaveBeenCalled();
    expect(component.currentIdx()).toBe(1);
  });
});
