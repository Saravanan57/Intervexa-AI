const Interview = require('../models/Interview');
const Feedback = require('../models/Feedback');
const Report = require('../models/Report');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const aiService = require('../services/ai.service');
const logger = require('../utils/logger');

exports.createSession = async (req, res, next) => {
  try {
    const { type, skills, experience, questionCount, difficulty, domain, durationLimit, jobRole, voiceEnabled } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, message: 'Interview type is required.' });
    }

    const selectedRole = jobRole || domain || 'Full Stack Developer';
    let targetSkills = skills || [];
    if (targetSkills.length === 0) {
      targetSkills = [selectedRole];
    }

    const count = questionCount || 5;
    const exp = experience || req.user.experience || '1-3 Years';
    const diff = difficulty || 'medium';
    const dom = selectedRole;
    const limit = durationLimit || 20;

    // 1. Generate questions
    let questionsList = [];
    try {
      questionsList = await aiService.generateInterviewQuestions(targetSkills, type, exp, count, diff, dom);
    } catch (err) {
      logger.error('Failed to generate interview questions: %s', err.message);
      return res.status(500).json({ success: false, message: 'AI question generation failed.' });
    }

    // 2. Create session
    const interview = await Interview.create({
      user: req.user._id,
      type,
      status: 'active',
      questions: questionsList.map(q => ({
        text: q.text,
        type: type,
        codeTemplate: q.codeTemplate || '',
        sampleAnswer: q.sampleAnswer || '',
        category: q.category || 'General'
      })),
      answers: [],
      currentQuestionIndex: 0,
      domain: dom,
      difficulty: diff,
      durationLimit: limit,
      predictedScore: 0
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'INTERVIEW_START',
      ipAddress: req.ip || '',
      details: `Started ${type} Mock Interview (${dom}, ${diff}). Session ID: ${interview._id}`
    });

    res.status(201).json({
      success: true,
      interview: {
        id: interview._id,
        type: interview.type,
        status: interview.status,
        questionCount: interview.questions.length,
        currentQuestionIndex: interview.currentQuestionIndex,
        domain: interview.domain,
        difficulty: interview.difficulty,
        durationLimit: interview.durationLimit,
        questions: interview.questions.map(q => ({
          text: q.text,
          codeTemplate: q.codeTemplate || ''
        }))
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.submitAnswer = async (req, res, next) => {
  try {
    const { interviewId, responseText, codeSubmitted, audioUrl, duration } = req.body;
    
    if (!interviewId) {
      return res.status(400).json({ success: false, message: 'Interview session ID is required.' });
    }

    const interview = await Interview.findOne({ _id: interviewId, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    if (interview.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Interview session is not active.' });
    }

    const currentIdx = interview.currentQuestionIndex;
    if (currentIdx >= interview.questions.length) {
      return res.status(400).json({ success: false, message: 'All questions have already been answered.' });
    }

    const question = interview.questions[currentIdx];

    // 1. AI Grading
    let evaluation;
    const isSkipped = (responseText && responseText.toLowerCase().includes('skipped')) || 
                      (codeSubmitted && codeSubmitted.toLowerCase().includes('skipped'));

    if (isSkipped) {
      evaluation = { 
        feedbackScore: 0, 
        feedbackContent: 'Question was skipped by candidate.',
        technicalScore: 0,
        communicationScore: 0,
        confidenceScore: 0,
        grammarScore: 0,
        problemSolvingScore: 0,
        leadershipScore: 0
      };
    } else {
      try {
        if (interview.type === 'Coding') {
          evaluation = await aiService.evaluateCode(question.text, codeSubmitted || '');
        } else {
          evaluation = await aiService.evaluateAnswer(question.text, responseText || '', interview.type);
        }
      } catch (err) {
        logger.error('Failed to grade answer: %s', err.message);
        evaluation = { 
          feedbackScore: 60, 
          feedbackContent: 'Gratitude for submitting. Automated backup score applied.',
          technicalScore: 60,
          communicationScore: 60,
          confidenceScore: 65,
          grammarScore: 80,
          problemSolvingScore: 60,
          leadershipScore: 60
        };
      }
    }

    // 2. Add answer
    interview.answers.push({
      questionText: question.text,
      responseText: responseText || '',
      codeSubmitted: codeSubmitted || '',
      audioUrl: audioUrl || '',
      feedbackScore: evaluation.feedbackScore || 0,
      feedbackContent: evaluation.feedbackContent || ''
    });

    // Inject dynamic follow-up question if candidate gave a typed/verbal response
    const validResponse = responseText && responseText.trim().length > 15 && !responseText.includes('skipped');
    if (validResponse && interview.answers.length % 2 === 1 && interview.questions.length < 8) {
      try {
        const followUpText = await aiService.generateFollowUpQuestion(question.text, responseText);
        interview.questions.splice(interview.currentQuestionIndex + 1, 0, {
          text: followUpText,
          type: interview.type,
          codeTemplate: '',
          sampleAnswer: 'Elaborate on details mentioned in previous response.',
          category: question.category || 'Follow-Up'
        });
      } catch (err) {
        logger.error('Failed to inject dynamic follow-up question: %s', err.message);
      }
    }

    interview.currentQuestionIndex += 1;
    if (duration) {
      interview.duration += duration;
    }

    // Calculate dynamic Predicted Score (running average)
    const runningSum = interview.answers.reduce((acc, ans) => acc + ans.feedbackScore, 0);
    interview.predictedScore = Math.round(runningSum / interview.answers.length);

    let finished = false;
    let badgeEarned = null;

    // 3. If interview completed, compile metrics & check badges
    if (interview.currentQuestionIndex >= interview.questions.length) {
      interview.status = 'completed';
      const avgScore = interview.predictedScore;
      interview.score = avgScore;
      await interview.save();

      // Formulate feedback Bullet lists
      const positives = [];
      const negatives = [];
      const improvements = [];
      interview.answers.forEach((ans, i) => {
        if (ans.feedbackScore >= 75) {
          positives.push(`Q${i+1} (${interview.questions[i].category}): High marks for technical logic.`);
        } else {
          negatives.push(`Q${i+1} (${interview.questions[i].category}): Missing technical depth.`);
          improvements.push(`Review correct syntax guides for Q${i+1}.`);
        }
      });

      if (positives.length === 0) positives.push('Maintained steady progress throughout.');
      if (negatives.length === 0) negatives.push('No major errors noted.');
      if (improvements.length === 0) improvements.push('Practice mock speaking speeds to reduce verbal hesitation.');

      // Save Feedback
      await Feedback.create({
        interview: interview._id,
        overallScore: avgScore,
        positivePoints: positives,
        negativePoints: negatives,
        improvementTips: improvements
      });

      // Save Report
      await Report.create({
        user: req.user._id,
        interview: interview._id,
        title: `${interview.type} Mock - ${interview.domain} (${interview.difficulty})`,
        keyMetrics: {
          technicalScore: evaluation.technicalScore || avgScore,
          communicationScore: evaluation.communicationScore || avgScore,
          codingScore: interview.type === 'Coding' ? (evaluation.problemSolvingScore || avgScore) : 0,
          behavioralScore: evaluation.leadershipScore || avgScore
        },
        detailedSummary: `AI graded scorecard for your ${interview.type} prep session focusing on ${interview.domain}. Overall average rating achieved is ${avgScore}%.`
      });

      // Trigger Badge/Achievements and issue Notifications
      const user = await User.findById(req.user._id);
      const completedSessionsCount = await Interview.countDocuments({ user: req.user._id, status: 'completed' });
      
      const badgePool = [];
      if (completedSessionsCount === 1) {
        badgePool.push({ badgeName: 'First Mock Interview', badgeIcon: '🎓', description: 'Completed your very first AI mock interview!' });
      }
      if (completedSessionsCount === 10) {
        badgePool.push({ badgeName: 'Deca Performer', badgeIcon: '🏆', description: 'Successfully finished 10 mock interviews!' });
      }
      if (avgScore >= 90) {
        badgePool.push({ badgeName: 'Top Performer Specialist', badgeIcon: '⭐', description: 'Scored 90% or above in a mock session!' });
      }

      for (const badge of badgePool) {
        const alreadyAwarded = user.achievements.some(a => a.badgeName === badge.badgeName);
        if (!alreadyAwarded) {
          user.achievements.push(badge);
          badgeEarned = badge;
          
          // Add notification
          await Notification.create({
            user: user._id,
            title: `🏆 New Badge Unlocked: ${badge.badgeName}`,
            message: badge.description,
            type: 'success'
          });
        }
      }
      await user.save();

      // General Interview Completed Notification
      await Notification.create({
        user: req.user._id,
        title: 'Interview Completed Successfully',
        message: `Your ${interview.type} session score is graded. View your scorecard feedback reports now.`,
        type: 'info'
      });

      await ActivityLog.create({
        user: req.user._id,
        action: 'INTERVIEW_COMPLETE',
        ipAddress: req.ip || '',
        details: `Completed ${interview.type} Mock. Score: ${avgScore}%`
      });

      finished = true;
    } else {
      await interview.save();
    }

    res.status(200).json({
      success: true,
      finished,
      currentQuestionIndex: interview.currentQuestionIndex,
      predictedScore: interview.predictedScore,
      badgeEarned,
      evaluation: {
        score: evaluation.feedbackScore,
        feedback: evaluation.feedbackContent
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { domain, score, type } = req.query;
    const filter = { user: req.user._id };

    if (domain) {
      filter.domain = domain;
    }
    if (type) {
      filter.type = type;
    }
    if (score) {
      const minScore = parseInt(score);
      filter.score = { $gte: minScore };
    }

    const sessions = await Interview.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      sessions
    });
  } catch (err) {
    next(err);
  }
};

exports.getInterviewDetails = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    const feedback = await Feedback.findOne({ interview: interview._id });
    const report = await Report.findOne({ interview: interview._id });

    res.status(200).json({
      success: true,
      interview,
      feedback,
      report
    });
  } catch (err) {
    next(err);
  }
};

exports.downloadReportHtml = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id }).populate('user');
    if (!interview) {
      return res.status(404).send('Report not found');
    }

    const feedback = await Feedback.findOne({ interviewId: interview._id });
    const resume = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });

    const candidateName = interview.user?.name || 'Candidate';
    const candidateEmail = interview.user?.email || 'N/A';
    const resumeScore = resume ? resume.score : 75;
    
    const techScore = feedback ? feedback.technicalScore : interview.score;
    const commScore = feedback ? feedback.communicationScore : interview.score;
    const gramScore = feedback ? feedback.grammarScore : 90;
    const probScore = feedback ? feedback.problemSolvingScore : interview.score;
    const confScore = feedback ? feedback.confidenceScore : 85;
    const leadScore = feedback ? feedback.leadershipScore : 80;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=Intervexa-AI-Report-${interview._id}.html`);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Intervexa AI Performance Scorecard</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
          body { font-family: 'Outfit', sans-serif; background-color: #FAFAFB; color: #1F2937; margin: 40px; }
          .header { border-bottom: 2px solid #7C3AED; padding-bottom: 25px; margin-bottom: 30px; }
          .title { color: #7C3AED; margin: 0; font-size: 32px; font-weight: 800; }
          .score-badge { float: right; background-color: #7C3AED; color: white; padding: 12px 24px; font-weight: 800; font-size: 26px; border-radius: 12px; box-shadow: 0 4px 10px rgba(124, 58, 237, 0.2); }
          .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-top: 15px; background: white; padding: 15px; border-radius: 12px; border: 1px solid #E5E7EB; }
          .meta-item { font-size: 13px; color: #4B5563; }
          .section { margin-bottom: 35px; background: white; padding: 25px; border-radius: 16px; border: 1px solid #E5E7EB; }
          .section-title { font-size: 18px; font-weight: 600; border-bottom: 2px solid #F3F4F6; padding-bottom: 10px; margin-bottom: 20px; color: #111827; }
          .grid-2 { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; }
          
          /* Timeline */
          .timeline { position: relative; padding-left: 30px; border-left: 2px solid #E5E7EB; margin-left: 10px; }
          .timeline-item { position: relative; margin-bottom: 20px; }
          .timeline-dot { position: absolute; left: -36px; top: 3px; width: 10px; height: 10px; rounded-full; background: #06B6D4; border: 2px solid white; border-radius: 50%; }
          .timeline-text { font-size: 13px; font-weight: 600; }
          .timeline-sub { font-size: 11px; color: #6B7280; }

          /* Custom lists */
          ul { padding-left: 20px; margin: 0; }
          li { margin-bottom: 6px; font-size: 13px; color: #4B5563; }
          .btn-print { background: #06B6D4; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <button onclick="window.print()" class="btn-print">🖨 Print / Save as PDF</button>

        <div class="header">
          <div class="score-badge">${interview.score}%</div>
          <h1 class="title">Intervexa AI Performance Scorecard</h1>
          <div class="meta-grid">
            <div class="meta-item">
              <strong>Candidate Name:</strong> ${candidateName}<br>
              <strong>Candidate Email:</strong> ${candidateEmail}<br>
              <strong>Resume ATS Score:</strong> ${resumeScore}%
            </div>
            <div class="meta-item">
              <strong>Interview Domain:</strong> ${interview.domain}<br>
              <strong>Interview Type:</strong> ${interview.type}<br>
              <strong>Session Date:</strong> ${new Date(interview.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div class="grid-2">
          <!-- Charts Section -->
          <div class="section">
            <h2 class="section-title">AI Performance Charts</h2>
            <div style="text-align: center; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #9CA3AF;">RADAR SCORES INDEX</h4>
              <svg width="180" height="180" viewBox="0 0 200 200" style="margin: 0 auto; display: block;">
                <polygon points="100,20 180,70 150,160 50,160 20,70" fill="none" stroke="#E5E7EB" stroke-width="1.5"/>
                <polygon points="100,50 150,85 130,130 70,130 50,85" fill="none" stroke="#E5E7EB" stroke-width="1"/>
                <text x="100" y="14" font-size="8" text-anchor="middle" fill="#9CA3AF">TECH</text>
                <text x="185" y="74" font-size="8" text-anchor="start" fill="#9CA3AF">COMM</text>
                <text x="155" y="172" font-size="8" text-anchor="start" fill="#9CA3AF">GRAM</text>
                <text x="45" y="172" font-size="8" text-anchor="end" fill="#9CA3AF">PROBLEM</text>
                <text x="12" y="74" font-size="8" text-anchor="end" fill="#9CA3AF">LEAD</text>
                <polygon points="100,${100 - techScore*0.7} ${100 + commScore*0.8},${100 - commScore*0.3} ${100 + gramScore*0.5},${100 + gramScore*0.6} ${100 - probScore*0.5},${100 + probScore*0.6} ${100 - leadScore*0.8},${100 - leadScore*0.3}" fill="rgba(124,58,237,0.25)" stroke="#7C3AED" stroke-width="2"/>
              </svg>
            </div>
            
            <h4 style="margin: 20px 0 10px 0; font-size: 12px; color: #9CA3AF; text-align: center;">SUB-SCORES GRID</h4>
            <div style="space-y-2; font-size: 11px;">
              <div style="display:flex; justify-content:space-between; margin-bottom: 4px;"><span>Technical Mastery:</span><strong>${techScore}%</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom: 4px;"><span>Communication Pacing:</span><strong>${commScore}%</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom: 4px;"><span>Grammar check:</span><strong>${gramScore}%</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom: 4px;"><span>Problem Solving:</span><strong>${probScore}%</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom: 4px;"><span>Leadership Capability:</span><strong>${leadScore}%</strong></div>
            </div>
          </div>

          <!-- Progress Timeline Section -->
          <div class="section">
            <h2 class="section-title">Session Progress Timeline</h2>
            <div class="timeline">
              ${interview.answers.map((ans, i) => `
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-text">Question ${i+1}: ${ans.questionText.substring(0, 45)}...</div>
                  <div class="timeline-sub">AI Grader Score: <strong>${ans.feedbackScore}%</strong></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Personalized Career Roadmap & Study Guide</h2>
          <div class="grid-2">
            <div>
              <h4 style="margin:0 0 10px 0; font-size:13px; color:#111827;">Learning Recommendations</h4>
              <ul>
                ${(feedback?.learningResources && feedback.learningResources.length > 0)
                  ? feedback.learningResources.map(res => `<li>✔ ${res}</li>`).join('')
                  : '<li>✔ Read Advanced JavaScript Design Patterns.</li><li>✔ Review Mongoose aggregation pipeline guides.</li>'
                }
              </ul>
            </div>
            <div>
              <h4 style="margin:0 0 10px 0; font-size:13px; color:#111827;">Career Suggestions</h4>
              <ul>
                ${(feedback?.careerSuggestions && feedback.careerSuggestions.length > 0)
                  ? feedback.careerSuggestions.map(role => `<li>🎯 ${role}</li>`).join('')
                  : '<li>🎯 Senior Full Stack Engineer</li><li>🎯 Solutions Architect</li>'
                }
              </ul>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">AI Feedback Breakdown</h2>
          <h4 style="color:#059669; margin: 0 0 5px 0; font-size:13px;">Strengths</h4>
          <ul style="margin-bottom: 15px;">
            ${(feedback?.strengths || []).map(p => `<li>• ${p}</li>`).join('') || '<li>• Good concept structure and API logics explanation.</li>'}
          </ul>
          <h4 style="color:#DC2626; margin: 0 0 5px 0; font-size:13px;">Weaknesses</h4>
          <ul style="margin-bottom: 15px;">
            ${(feedback?.weaknesses || []).map(n => `<li>• ${n}</li>`).join('') || '<li>• Needs deeper explanations of microservices architecture.</li>'}
          </ul>
          <h4 style="color:#7C3AED; margin: 0 0 5px 0; font-size:13px;">Improvement Suggestions</h4>
          <ul>
            ${(feedback?.recommendations || []).map(r => `<li>• ${r}</li>`).join('') || '<li>• Answer with concrete project scenarios to improve credibility.</li>'}
          </ul>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    next(err);
  }
};

exports.finishSession = async (req, res, next) => {
  try {
    const { interviewId } = req.body;
    if (!interviewId) {
      return res.status(400).json({ success: false, message: 'Interview session ID is required.' });
    }

    const interview = await Interview.findOne({ _id: interviewId, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    if (interview.status !== 'completed') {
      interview.status = 'completed';
      const avgScore = interview.predictedScore || 0;
      interview.score = avgScore;
      interview.overallScore = avgScore;
      await interview.save();

      // Formulate feedback lists
      const positives = [];
      const negatives = [];
      const improvements = [];
      interview.answers.forEach((ans, i) => {
        if (ans.feedbackScore >= 75) {
          positives.push(`Q${i+1} (${interview.questions[i]?.category || 'General'}): High marks for technical logic.`);
        } else {
          negatives.push(`Q${i+1} (${interview.questions[i]?.category || 'General'}): Missing technical depth.`);
          improvements.push(`Review correct syntax guides for Q${i+1}.`);
        }
      });

      if (positives.length === 0) positives.push('Maintained steady progress throughout.');
      if (negatives.length === 0) negatives.push('No major errors noted.');
      if (improvements.length === 0) improvements.push('Practice mock speaking speeds to reduce verbal hesitation.');

      // Save Feedback in database
      const feedback = await Feedback.create({
        interviewId: interview._id,
        interview: interview._id,
        overallScore: avgScore,
        strengths: positives,
        weaknesses: negatives,
        recommendations: improvements,
        positivePoints: positives,
        negativePoints: negatives,
        improvementTips: improvements,
        technicalScore: avgScore,
        communicationScore: avgScore,
        grammarScore: 90,
        confidenceScore: 85,
        problemSolvingScore: avgScore,
        leadershipScore: 80,
        learningResources: ['Advanced Web Architecture', 'Design Patterns in Node.js'],
        careerSuggestions: ['Frontend Developer', 'Backend Architect']
      });

      interview.feedbackId = feedback._id;
      await interview.save();

      // Compile Report
      await Report.create({
        user: req.user._id,
        interview: interview._id,
        title: `${interview.type} Mock - ${interview.domain} (${interview.difficulty})`,
        keyMetrics: {
          technicalScore: avgScore,
          communicationScore: avgScore,
          codingScore: interview.type === 'Coding' ? avgScore : 0,
          behavioralScore: avgScore
        },
        detailedSummary: `AI graded scorecard for your completed ${interview.type} prep session focusing on ${interview.domain}.`
      });

      // Badges check
      const User = require('../models/User');
      const user = await User.findById(req.user._id);
      const completedSessionsCount = await Interview.countDocuments({ user: req.user._id, status: 'completed' });
      if (completedSessionsCount === 1) {
        const badge = { badgeName: 'First Mock Interview', badgeIcon: '🎓', description: 'Completed your very first AI mock interview!' };
        const hasBadge = user.achievements.some(a => a.badgeName === badge.badgeName);
        if (!hasBadge) {
          user.achievements.push(badge);
          await user.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Interview session completed successfully.',
      interview
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteInterviewSession = async (req, res, next) => {
  try {
    const interview = await Interview.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }
    
    // Clear linked feedbacks & reports
    await Feedback.deleteMany({ interviewId: req.params.id });
    const Report = require('../models/Report');
    await Report.deleteMany({ interview: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Interview record and reports deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};
