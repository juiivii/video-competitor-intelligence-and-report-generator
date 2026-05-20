import { pptGenerator } from '@/lib/services/pptGenerator';

export async function POST(req: Request) {
  try {
    // Parse JSON with error handling
    let report;
    try {
      report = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return Response.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate report structure
    if (!report || typeof report !== 'object') {
      return Response.json(
        { error: 'Invalid report data: expected object' },
        { status: 400 }
      );
    }

    // Validate competitors array - CRITICAL: must check length
    if (!report.competitors || !Array.isArray(report.competitors) || report.competitors.length === 0) {
      return Response.json(
        { error: 'Invalid report data: competitors array is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Log safely (not entire object)
    console.log('PPT Export requested for', report.competitors.length, 'competitors');

    // Generate PPT with error handling
    let pptx;
    try {
      pptx = pptGenerator.generateReport(report);
    } catch (genError) {
      console.error('PPT generation error:', genError);
      return Response.json(
        { error: 'Failed to generate report from provided data' },
        { status: 500 }
      );
    }

    // Create buffer
    const buffer = await pptx.write({
  outputType: "nodebuffer"
}) as Buffer;

console.log(
  'PPT generated successfully:',
  Math.round(buffer.length / 1024),
  'KB'
);

    return new Response(buffer as BlobPart, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="video-intelligence-report.pptx"',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PPT EXPORT ERROR:', error);

    return Response.json(
      {
        error: 'Failed to export PPT',
        details: String(error),
      },
      {
        status: 500,
      }
    );
  }
}