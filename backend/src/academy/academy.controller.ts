import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AcademyService } from './academy.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CourseStatus, UserRole } from '@ile-ase/common';

@ApiTags('academy')
@ApiBearerAuth()
@Controller('academy')
@UseGuards(AuthGuard('jwt'))
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  // ==================== Courses ====================

  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course successfully created' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires Babalawo or Admin role' })
  @Post('courses')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createCourse(@Body() dto: CreateCourseDto, @CurrentUser() user: CurrentUserPayload) {
    return this.academyService.createCourse(dto, user);
  }

  @ApiOperation({ summary: 'Get all courses with optional filtering' })
  @ApiQuery({ name: 'instructorId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', enum: CourseStatus, required: false })
  @ApiResponse({ status: 200, description: 'Returns a list of courses' })
  @Get('courses')
  async findAllCourses(
    @Query('instructorId') instructorId?: string,
    @Query('category') category?: string,
    @Query('status') status?: CourseStatus
  ) {
    return this.academyService.findAllCourses(instructorId, category, status);
  }

  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Returns the course details' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @Get('courses/:id')
  async findCourseById(@Param('id') id: string) {
    return this.academyService.findCourseById(id);
  }

  @ApiOperation({ summary: 'Get course by slug' })
  @ApiParam({ name: 'slug', description: 'Course slug' })
  @ApiResponse({ status: 200, description: 'Returns the course details' })
  @Get('courses/slug/:slug')
  async findCourseBySlug(@Param('slug') slug: string) {
    return this.academyService.findCourseBySlug(slug);
  }

  @ApiOperation({ summary: 'Update a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course successfully updated' })
  @Patch('courses/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO, UserRole.ADMIN)
  async updateCourse(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.academyService.updateCourse(id, dto, user);
  }

  // ==================== Lessons ====================

  @ApiOperation({ summary: 'Create a new lesson in a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Lesson successfully created' })
  @Post('courses/:courseId/lessons')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createLesson(
    @Param('courseId') courseId: string,
    @Body() dto: CreateLessonDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.academyService.createLesson(courseId, dto, user);
  }

  @ApiOperation({ summary: 'Get all lessons for a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Returns a list of lessons' })
  @Get('courses/:courseId/lessons')
  async findAllLessons(@Param('courseId') courseId: string) {
    return this.academyService.findAllLessons(courseId);
  }

  @ApiOperation({ summary: 'Get lesson by ID' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Returns the lesson details' })
  @Get('lessons/:id')
  async findLessonById(@Param('id') id: string) {
    return this.academyService.findLessonById(id);
  }

  @ApiOperation({ summary: 'Update a lesson' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson successfully updated' })
  @Patch('lessons/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO, UserRole.ADMIN)
  async updateLesson(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.academyService.updateLesson(id, dto, user);
  }

  @ApiOperation({ summary: 'Delete a lesson' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson successfully deleted' })
  @Delete('lessons/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO, UserRole.ADMIN)
  async deleteLesson(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.academyService.deleteLesson(id, user);
  }

  // ==================== Enrollments ====================

  @ApiOperation({ summary: 'Enroll in a course' })
  @ApiResponse({ status: 201, description: 'Successfully enrolled' })
  @Post('enrollments')
  @HttpCode(HttpStatus.CREATED)
  async createEnrollment(
    @Body() dto: CreateEnrollmentDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.academyService.createEnrollment(dto, user);
  }

  @ApiOperation({ summary: 'Get all enrollments for a user' })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiResponse({ status: 200, description: 'Returns a list of enrollments' })
  @Get('enrollments')
  async findAllEnrollments(
    @Query('courseId') courseId: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.academyService.findAllEnrollments(user, courseId);
  }

  @ApiOperation({ summary: 'Get enrollment by ID' })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({ status: 200, description: 'Returns enrollment details' })
  @Get('enrollments/:id')
  async findEnrollmentById(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.academyService.findEnrollmentById(id, user);
  }

  @ApiOperation({ summary: 'Update enrollment status/progress' })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({ status: 200, description: 'Enrollment successfully updated' })
  @Patch('enrollments/:id')
  async updateEnrollment(
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.academyService.updateEnrollment(id, dto, user);
  }

  // ==================== Lesson Completions ====================

  @ApiOperation({ summary: 'Mark a lesson as completed' })
  @ApiParam({ name: 'enrollmentId', description: 'Enrollment ID' })
  @ApiResponse({ status: 200, description: 'Lesson successfully marked as completed' })
  @Post('enrollments/:enrollmentId/complete-lesson')
  @HttpCode(HttpStatus.OK)
  async completeLesson(
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: CompleteLessonDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.academyService.completeLesson(dto, enrollmentId, user);
  }

  @ApiOperation({ summary: 'Get all lesson completions for an enrollment' })
  @ApiParam({ name: 'enrollmentId', description: 'Enrollment ID' })
  @ApiResponse({ status: 200, description: 'Returns a list of completed lesson IDs' })
  @Get('enrollments/:enrollmentId/completions')
  async getLessonCompletions(@Param('enrollmentId') enrollmentId: string) {
    return this.academyService.getLessonCompletions(enrollmentId);
  }
}
